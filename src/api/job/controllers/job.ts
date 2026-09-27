/**
 * job controller
 */

import { factories } from "@strapi/strapi";
import { slaOf } from "../../../utils/sla";
import { canEditJob, canTakeOver } from "../../../utils/job-rules";
import { logHistory } from "../../../utils/history";
import type { Core } from "@strapi/strapi";
import { canTransition, nextActions } from "../../../utils/job-status";
import { getActorId } from "../../../utils/actor";

// Field yang CUMA boleh diisi server, gak boleh dari body request
const PROTECTED = [
  "jobStatus",
  "startedAt",
  "completedAt",
  "assignee",
  "assignedAt",
];

function stripProtected(data: Record<string, unknown> = {}) {
  const clean = { ...data };
  for (const field of PROTECTED) delete clean[field];
  return clean;
}

// Satu tempat buat nempelin field hasil hitungan BE ke sebuah job
function withComputed(job: any, now: Date) {
  return { ...job, slaLabel: slaOf(job, now), canEdit: canEditJob(job) };
}

// Ambil job + pastiin yang manggil itu PEMEGANG job-nya. Dipakai sama start, notes, dan done
async function findOwnJob(strapi: Core.Strapi, ctx: any) {
  const actorId = getActorId(ctx);
  if (!actorId) return ctx.unauthorized('Pilih user dulu');

  const job = await strapi.documents('api::job.job').findOne({
    documentId: ctx.params.id,
    populate: ['assignee'],
  });
  if (!job) return ctx.notFound('Job tidak ditemukan');
  if (job.assignee?.documentId !== actorId) return ctx.forbidden('Ini bukan job kamu'); // US04-05

  return { job, actorId };
}

export default factories.createCoreController("api::job.job", ({ strapi }) => ({
  // GET /jobs → tambahin slaLabel + canEdit (BE yang mutusin, FE tinggal nampilin)
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    const now = new Date();
    return { data: data.map((job: any) => withComputed(job, now)), meta }; // 🆕 pakai withComputed
  },

  // GET /jobs/:id → satu job, tapi tetap dapat slaLabel + canEdit
  async findOne(ctx) {
    const res = await super.findOne(ctx);
    if (!res?.data) return res;
    return { ...res, data: withComputed(res.data, new Date()) };
  },

  // POST /jobs → job baru SELALU Not Started, apa pun yang dikirim FE
  async create(ctx) {
    ctx.request.body.data = {
      ...stripProtected(ctx.request.body.data),
      jobStatus: "NOT_STARTED",
    };
    const res = await super.create(ctx);
    await logHistory(strapi, {
      job: res.data.documentId,
      actionType: "CREATED",
    }); // 🆕 catat
    return res;
  },

  // PUT /jobs/:id → cuma boleh kalau masih Not Started
  async update(ctx) {
    const job = await strapi
      .documents("api::job.job")
      .findOne({ documentId: ctx.params.id });
    if (!job) return ctx.notFound("Job tidak ditemukan");
    if (!canEditJob(job))
      return ctx.badRequest("Job hanya bisa diedit saat Not Started");
    ctx.request.body.data = stripProtected(ctx.request.body.data);
    return super.update(ctx);
  },

  // DELETE /jobs/:id → cuma boleh kalau masih Not Started
  async delete(ctx) {
    const job = await strapi
      .documents("api::job.job")
      .findOne({ documentId: ctx.params.id });
    if (!job) return ctx.notFound("Job tidak ditemukan");
    if (!canEditJob(job))
      return ctx.badRequest("Job hanya bisa dihapus saat Not Started");

    // 🆕 Hapus riwayatnya dulu, biar gak ada history yang nunjuk ke job yang udah gak ada
    const histories = await strapi
      .documents("api::job-history.job-history")
      .findMany({
        filters: { job: { documentId: job.documentId } },
      });
    for (const h of histories) {
      await strapi
        .documents("api::job-history.job-history")
        .delete({ documentId: h.documentId });
    }
    return super.delete(ctx);
  },

  // GET /jobs/:id/candidates → siapa aja yang boleh di-assign (yang punya jadwal di tanggal job)
  async candidates(ctx) {
    const job = await strapi
      .documents("api::job.job")
      .findOne({ documentId: ctx.params.id });

    if (!job) return ctx.notFound("Job tidak ditemukan");
    if (!job.jobDate) return ctx.badRequest("Job belum punya tanggal");

    const schedules = await strapi
      .documents("api::shift-schedule.shift-schedule")
      .findMany({
        filters: { shiftDate: job.jobDate },
        populate: { member: true, shift: true },
      });
    return {
      data: schedules.map((s) => ({ member: s.member, shift: s.shift })),
    };
  },

  // POST /jobs/:id/assign → body { memberId }
  async assign(ctx) {
    const { memberId } = ctx.request.body ?? {};
    if (!memberId) return ctx.badRequest("memberId wajib diisi"); // ← ini

    const job = await strapi.documents("api::job.job").findOne({
      documentId: ctx.params.id,
      populate: ["assignee"], // 🆕 biar tahu siapa pemegang sebelumnya
    });

    if (!job) return ctx.notFound("Job tidak ditemukan");
    if (!job.jobDate) return ctx.badRequest("Job belum punya tanggal"); // ← tambahin ini
    if (!canEditJob(job))
      return ctx.badRequest("Job hanya bisa di-assign saat Not Started");

    // Cek ULANG aturan yang sama kayak di candidates
    const schedule = await strapi
      .documents("api::shift-schedule.shift-schedule")
      .findFirst({
        filters: { shiftDate: job.jobDate, member: { documentId: memberId } },
      });
    if (!schedule)
      return ctx.badRequest("User ini tidak punya jadwal di tanggal job");

    const previous = job.assignee?.documentId; // 🆕 kosong kalau ini assign pertama

    const updated = await strapi.documents("api::job.job").update({
      documentId: job.documentId,
      data: { assignee: memberId, assignedAt: new Date().toISOString() }, // jam server
      populate: ["assignee"],
    });

    // 🆕 catat: user = pemegang baru, previousUser = pemegang lama (kalau reassign)
    await logHistory(strapi, {
      job: job.documentId,
      actionType: "ASSIGNED",
      user: memberId,
      previousUser: previous,
    });
    return { data: updated };
  },

  // GET /jobs/mine → job milik user yang lagi manggil
  async mine(ctx) {
    const actorId = getActorId(ctx);
    if (!actorId) return ctx.unauthorized("Pilih user dulu");

    const jobs = await strapi.documents("api::job.job").findMany({
      filters: { assignee: { documentId: actorId } },
      sort: "deadline:asc",
      populate: ["assignee"],
    });
    const now = new Date();
    return {
      data: jobs.map((j) => ({
        ...withComputed(j, now),
        actions: nextActions(j.jobStatus),
      })),
    };
  },

  // POST /jobs/:id/start
  async start(ctx) {
    const own = await findOwnJob(strapi, ctx);
    if (!own?.job) return;
    const { job, actorId } = own;

    if (!canTransition(job.jobStatus, "IN_PROGRESS")) {
      return ctx.badRequest(
        "Status harus berurutan: job ini tidak bisa di-Start",
      );
    }
    const updated = await strapi.documents("api::job.job").update({
      documentId: job.documentId,
      data: {
        jobStatus: "IN_PROGRESS",
        startedAt: job.startedAt ?? new Date().toISOString(),
      },
    });
    await logHistory(strapi, {
      job: job.documentId,
      actionType: "STARTED",
      user: actorId,
    });
    return { data: withComputed(updated, new Date()) };
  },

  // POST /jobs/:id/notes → body { content }
  async notes(ctx) {
    const own = await findOwnJob(strapi, ctx);
    if (!own?.job) return;
    const { job, actorId } = own;

    const content = String(ctx.request.body?.content ?? "").trim();
    if (!content) return ctx.badRequest("Catatan tidak boleh kosong"); // US04-11
    if (job.jobStatus !== "IN_PROGRESS") {
      return ctx.badRequest("Catatan cuma bisa ditambah saat In Progress"); // US04-10, US04-13
    }
    await logHistory(strapi, {
      job: job.documentId,
      actionType: "NOTE",
      user: actorId,
      description: content,
    });
    return { data: { ok: true } };
  },

  // POST /jobs/:id/done → body { note? } (catatan terakhir opsional, kayak mockup slide 22)
  async done(ctx) {
    const own = await findOwnJob(strapi, ctx);
    if (!own?.job) return;
    const { job, actorId } = own;

    if (!canTransition(job.jobStatus, "DONE")) {
      return ctx.badRequest("Status harus berurutan: job ini belum di-Start"); // US04-01
    }
    const note = String(ctx.request.body?.note ?? "").trim();
    if (note) {
      await logHistory(strapi, {
        job: job.documentId,
        actionType: "NOTE",
        user: actorId,
        description: note,
      });
    }
    const updated = await strapi.documents("api::job.job").update({
      documentId: job.documentId,
      data: { jobStatus: "DONE", completedAt: new Date().toISOString() },
    });
    await logHistory(strapi, {
      job: job.documentId,
      actionType: "DONE",
      user: actorId,
    });
    return { data: withComputed(updated, new Date()) };
  },

  // GET /jobs/pending → job orang lain yang bisa kamu take over
  async pending(ctx) {
    const actorId = getActorId(ctx);
    if (!actorId) return ctx.unauthorized("Pilih user dulu");

    const jobs = await strapi.documents("api::job.job").findMany({
      filters: { jobStatus: { $ne: "DONE" } },
      sort: "deadline:asc",
      populate: ["assignee"],
    });
    const takeable = jobs.filter((j) => canTakeOver(j, actorId)); // aturan yang SAMA kayak di takeover
    if (takeable.length === 0) return { data: [] };

    // Ambil "catatan terakhir" per job (slide 24)
    const notes = await strapi
      .documents("api::job-history.job-history")
      .findMany({
        filters: {
          actionType: "NOTE",
          job: { documentId: { $in: takeable.map((j) => j.documentId) } },
        },
        sort: "createdAt:desc",
        populate: ["job"],
      });
    const lastNote = (jobId: string) =>
      notes.find((n) => n.job?.documentId === jobId)?.desc ?? null;

    const now = new Date();
    return {
      data: takeable.map((j) => ({
        ...withComputed(j, now),
        lastNote: lastNote(j.documentId),
      })),
    };
  },

  // POST /jobs/:id/takeover
  async takeover(ctx) {
    const actorId = getActorId(ctx);
    if (!actorId) return ctx.unauthorized("Pilih user dulu");

    const job = await strapi.documents("api::job.job").findOne({
      documentId: ctx.params.id,
      populate: ["assignee"],
    });
    if (!job) return ctx.notFound("Job tidak ditemukan");
    if (!canTakeOver(job, actorId))
      return ctx.badRequest("Job ini tidak bisa kamu ambil alih");

    const previous = job.assignee!.documentId;
    const updated = await strapi.documents("api::job.job").update({
      documentId: job.documentId,
      data: { assignee: actorId }, // cuma pemegangnya yang pindah. jobStatus & startedAt TETAP
      populate: ["assignee"],
    });
    await logHistory(strapi, {
      job: job.documentId,
      actionType: "TAKEOVER",
      user: actorId,
      previousUser: previous,
    });
    return { data: withComputed(updated, new Date()) };
  },
}));

// export default factories.createCoreController("api::job.job", () => ({
//   async find(ctx) {
//     const { data, meta } = await super.find(ctx);
//     const now = new Date(); // jam server
//     return {
//       data: data.map(
//         (job: { deadline: string; completedAt?: string | null }) => ({
//           ...job,
//           slaLabel: slaOf(job, now),
//         }),
//       ),
//       meta,
//     };
//   },
// }));
