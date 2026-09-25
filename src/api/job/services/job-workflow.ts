/**
 * job-workflow service (My Job List + Take Over Job)
 */

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ConflictError, httpStatusOf } from '../../../utils/errors';
import { auditLog, type LogUser } from '../../../utils/logger';

const JOB = 'api::job.job';
const HISTORY = 'api::job-history.job-history';

export const NOTE_MAX_LENGTH = 1000;

const NOTE_ACTION_TYPE = 'STARTED';

type JobStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
type JobAction = 'start' | 'note' | 'complete';

export interface Actor extends LogUser {
  id: number;
  documentId: string;
  username: string;
}

export interface RequestMeta {
  traceId?: string;
}

const ACTIONS_BY_STATUS: Record<JobStatus, JobAction[]> = {
  NOT_STARTED: ['start'],
  IN_PROGRESS: ['note', 'complete'],
  DONE: [],
};

const colorFor = (status: JobStatus, sla?: string | null) => {
  if (status === 'DONE') return sla === 'OVERDUE' ? 'RED' : 'GREEN';
  return status === 'IN_PROGRESS' ? 'ORANGE' : 'BLUE';
};

/** SLA untuk tampilan: nilai tersimpan kalau DONE, indikator live kalau belum. */
const slaStatusOf = (job: any, now: Date) => {
  if (job.jobStatus === 'DONE') return job.sla ?? null;
  return job.deadline && now > new Date(job.deadline) ? 'OVERDUE' : 'ON_TRACK';
};

const publicUser = (user: any) => (user ? { id: user.id, name: user.username } : null);

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const jobs = () => strapi.db.query(JOB);

  const failTransition = async (documentId: string, expected: string): Promise<never> => {
    const job = await jobs().findOne({ where: { documentId }, select: ['jobStatus'] });
    if (!job) throw new errors.NotFoundError('Job tidak ditemukan');
    throw new ConflictError(`Status job ${job.jobStatus}, aksi ini butuh status ${expected}`, {
      currentStatus: job.jobStatus,
      expectedStatus: expected,
    });
  };

  /** Cek ulang assignee setelah baris terkunci (policy bisa saja kalah balapan dengan take-over). */
  const assertAssignee = async (documentId: string, actor: Actor) => {
    const job = await jobs().findOne({
      where: { documentId },
      populate: { jobAssignedTo: { select: ['id'] } },
    });
    if (job?.jobAssignedTo?.id !== actor.id) {
      throw new errors.ForbiddenError('Hanya assignee yang boleh melakukan aksi ini');
    }
    return job;
  };

  const addHistory = (data: {
    job: string;
    actionType: string;
    user: string;
    previousUser?: string;
    description?: string | null;
    indicatorColor: string;
    at: Date;
  }) =>
    strapi.documents(HISTORY).create({
      data: {
        job: data.job,
        actionType: data.actionType,
        user: data.user,
        previousUser: data.previousUser,
        description: data.description ?? null,
        indicatorColor: data.indicatorColor,
        jobHistoryCreatedAt: data.at.toISOString(),
      } as any,
    });

  /** Jalankan aksi dan catat event gagal (4xx warn, 5xx error) ke audit log. */
  const audited = async <T>(
    rejectedAction: string,
    ctx: { actor: Actor; documentId?: string; meta: RequestMeta },
    fn: () => Promise<T>
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error: any) {
      const status = httpStatusOf(error);
      auditLog({
        action: status >= 500 ? `${rejectedAction.split('.')[0]}.error` : rejectedAction,
        level: status >= 500 ? 'error' : 'warn',
        message: error?.message ?? 'Unknown error',
        user: ctx.actor,
        jobId: ctx.documentId,
        statusBefore: error?.details?.currentStatus,
        traceId: ctx.meta.traceId,
        labels: { http_status: status, reason: error?.name },
        error,
      });
      throw error;
    }
  };

  return {
    NOTE_MAX_LENGTH,

    /** GET /my-job: job milik user pada tanggal WIB tertentu. */
    async findMine(actor: Actor, range: { start: Date; end: Date }) {
      const now = new Date();
      const rows = await jobs().findMany({
        where: {
          jobAssignedTo: { id: actor.id },
          jobDate: { $gte: range.start.toISOString(), $lt: range.end.toISOString() },
        },
        select: [
          'documentId',
          'title',
          'jobDate',
          'deadline',
          'jobStatus',
          'sla',
          'slaDuration',
          'jobStartedAt',
          'jobCompletedAt',
        ],
        orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
      });

      return rows.map((job: any) => ({
        id: job.documentId,
        title: job.title,
        job_date: job.jobDate,
        deadline: job.deadline,
        status: job.jobStatus,
        sla_status: slaStatusOf(job, now),
        started_at: job.jobStartedAt ?? null,
        completed_at: job.jobCompletedAt ?? null,
        duration_seconds: job.slaDuration != null ? Number(job.slaDuration) : null,
        actions: ACTIONS_BY_STATUS[job.jobStatus as JobStatus] ?? [],
      }));
    },

    /** GET /my-job/pending: job belum DONE milik user lain + catatan terakhir. */
    async findPending(actor: Actor) {
      const now = new Date();
      const rows = await jobs().findMany({
        where: {
          jobStatus: { $ne: 'DONE' },
          jobAssignedTo: { id: { $notNull: true, $ne: actor.id } },
        },
        select: ['id', 'documentId', 'title', 'jobDate', 'deadline', 'jobStatus', 'jobStartedAt'],
        populate: { jobAssignedTo: { select: ['id', 'username'] } },
        orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
      });

      const lastNotes = new Map<number, any>();
      if (rows.length) {
        const notes = await strapi.db.query(HISTORY).findMany({
          where: {
            job: { id: { $in: rows.map((r: any) => r.id) } },
            actionType: NOTE_ACTION_TYPE,
            description: { $notNull: true },
          },
          select: ['description', 'jobHistoryCreatedAt', 'createdAt'],
          populate: { job: { select: ['id'] }, user: { select: ['id', 'username'] } },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
        for (const note of notes) {
          const jobId = note.job?.id;
          if (jobId && !lastNotes.has(jobId)) lastNotes.set(jobId, note);
        }
      }

      return rows.map((job: any) => {
        const note = lastNotes.get(job.id);
        return {
          id: job.documentId,
          title: job.title,
          job_date: job.jobDate,
          deadline: job.deadline,
          status: job.jobStatus,
          sla_status: slaStatusOf(job, now),
          started_at: job.jobStartedAt ?? null,
          previous_assignee: publicUser(job.jobAssignedTo),
          last_note: note
            ? {
                note: note.description,
                created_at: note.jobHistoryCreatedAt ?? note.createdAt,
                by: publicUser(note.user),
              }
            : null,
          actions: ['take_over'],
        };
      });
    },

    /** POST /my-job/:id/start: NOT_STARTED ke IN_PROGRESS. */
    async start(documentId: string, actor: Actor, meta: RequestMeta) {
      return audited('job.transition_rejected', { actor, documentId, meta }, async () => {
        const now = new Date();

        await strapi.db.transaction(async () => {
          const { count } = await jobs().updateMany({
            where: { documentId, jobStatus: 'NOT_STARTED' },
            data: { jobStatus: 'IN_PROGRESS', jobStartedAt: now, jobUpdatedAt: now },
          });
          if (!count) await failTransition(documentId, 'NOT_STARTED');
          await assertAssignee(documentId, actor);

          await addHistory({
            job: documentId,
            actionType: 'STARTED',
            user: actor.documentId,
            description: null,
            indicatorColor: colorFor('IN_PROGRESS'),
            at: now,
          });
        });

        auditLog({
          action: 'job.started',
          message: `Job ${documentId} dimulai oleh ${actor.username}`,
          user: actor,
          jobId: documentId,
          statusBefore: 'NOT_STARTED',
          statusAfter: 'IN_PROGRESS',
          traceId: meta.traceId,
        });

        return { id: documentId, status: 'IN_PROGRESS', started_at: now.toISOString() };
      });
    },

    /** POST /my-job/:id/notes: catatan progres saat IN_PROGRESS. `note` sudah divalidasi controller. */
    async addNote(documentId: string, actor: Actor, note: string, meta: RequestMeta) {
      return audited('job.transition_rejected', { actor, documentId, meta }, async () => {
        const now = new Date();

        await strapi.db.transaction(async () => {
          // Update bersyarat sekaligus mengunci baris selama transaksi.
          const { count } = await jobs().updateMany({
            where: { documentId, jobStatus: 'IN_PROGRESS' },
            data: { jobUpdatedAt: now },
          });
          if (!count) await failTransition(documentId, 'IN_PROGRESS');
          await assertAssignee(documentId, actor);

          await addHistory({
            job: documentId,
            actionType: NOTE_ACTION_TYPE,
            user: actor.documentId,
            description: note,
            indicatorColor: colorFor('IN_PROGRESS'),
            at: now,
          });
        });

        auditLog({
          action: 'job.note_added',
          message: `${actor.username} menambah catatan pada job ${documentId}`,
          user: actor,
          jobId: documentId,
          statusBefore: 'IN_PROGRESS',
          statusAfter: 'IN_PROGRESS',
          traceId: meta.traceId,
          labels: { note_length: note.length },
        });

        return { id: documentId, status: 'IN_PROGRESS', note, created_at: now.toISOString() };
      });
    },

    /** POST /my-job/:id/complete: IN_PROGRESS ke DONE, hitung SLA dan durasi (detik). */
    async complete(documentId: string, actor: Actor, meta: RequestMeta) {
      return audited('job.transition_rejected', { actor, documentId, meta }, async () => {
        const now = new Date();

        const result = await strapi.db.transaction(async () => {
          const { count } = await jobs().updateMany({
            where: { documentId, jobStatus: 'IN_PROGRESS' },
            data: { jobStatus: 'DONE', jobCompletedAt: now, jobUpdatedAt: now },
          });
          if (!count) await failTransition(documentId, 'IN_PROGRESS');
          const job = await assertAssignee(documentId, actor);

          const startedAt = job.jobStartedAt ? new Date(job.jobStartedAt) : now;
          const durationSeconds = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000));
          const sla = now.getTime() <= new Date(job.deadline).getTime() ? 'ON_TIME' : 'OVERDUE';

          await jobs().updateMany({
            where: { documentId },
            data: { sla, slaDuration: durationSeconds },
          });

          await addHistory({
            job: documentId,
            actionType: 'DONE',
            user: actor.documentId,
            description: `Selesai ${sla}, durasi ${durationSeconds} detik`,
            indicatorColor: colorFor('DONE', sla),
            at: now,
          });

          return { sla, durationSeconds };
        });

        auditLog({
          action: 'job.completed',
          message: `Job ${documentId} diselesaikan ${actor.username} (${result.sla})`,
          user: actor,
          jobId: documentId,
          statusBefore: 'IN_PROGRESS',
          statusAfter: 'DONE',
          traceId: meta.traceId,
          labels: { sla_status: result.sla, duration_seconds: result.durationSeconds },
        });

        return {
          id: documentId,
          status: 'DONE',
          completed_at: now.toISOString(),
          sla_status: result.sla,
          duration_seconds: result.durationSeconds,
        };
      });
    },

    /** POST /my-job/:id/take-over: ganti assignee ke user login, status tidak berubah. */
    async takeOver(documentId: string, actor: Actor, meta: RequestMeta) {
      return audited('job.take_over_rejected', { actor, documentId, meta }, async () => {
        const now = new Date();

        const result = await strapi.db.transaction(async () => {
          const { count } = await jobs().updateMany({
            where: { documentId, jobStatus: { $ne: 'DONE' } },
            data: { jobAssignedAt: now, jobUpdatedAt: now },
          });
          if (!count) await failTransition(documentId, 'NOT_STARTED atau IN_PROGRESS');

          // Dibaca setelah baris terkunci, jadi assignee ini pasti yang terbaru.
          const job = await jobs().findOne({
            where: { documentId },
            select: ['jobStatus'],
            populate: { jobAssignedTo: { select: ['id', 'documentId', 'username'] } },
          });
          const from = job.jobAssignedTo;

          if (!from) {
            throw new ConflictError('Job belum punya assignee, gunakan fitur assign admin', {
              currentStatus: job.jobStatus,
            });
          }
          if (from.id === actor.id) {
            throw new ConflictError('Job ini sudah milik Anda', { currentStatus: job.jobStatus });
          }

          await strapi.documents(JOB).update({
            documentId,
            data: { jobAssignedTo: actor.documentId } as any,
          });

          await addHistory({
            job: documentId,
            actionType: 'TAKEOVER',
            user: actor.documentId,
            previousUser: from.documentId,
            description: `Diambil alih dari ${from.username} oleh ${actor.username}`,
            indicatorColor: colorFor(job.jobStatus),
            at: now,
          });

          return { status: job.jobStatus as JobStatus, from };
        });

        auditLog({
          action: 'job.taken_over',
          message: `Job ${documentId} diambil alih ${result.from.username} ke ${actor.username}`,
          user: actor,
          jobId: documentId,
          statusBefore: result.status,
          statusAfter: result.status,
          traceId: meta.traceId,
          labels: {
            from_user: result.from.username,
            from_user_id: result.from.id,
            to_user: actor.username,
            to_user_id: actor.id,
          },
        });

        return {
          id: documentId,
          status: result.status,
          from_user: publicUser(result.from),
          to_user: publicUser(actor),
          assigned_at: now.toISOString(),
        };
      });
    },
  };
};
