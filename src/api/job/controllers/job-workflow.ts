/**
 * job-workflow controller (My Job List + Take Over Job)
 */

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { ConflictError } from '../../../utils/errors';
import { getTraceId } from '../../../utils/logger';
import { isValidDate, toWibDate, wibDayRange } from '../../../utils/time';
import type { Actor } from '../services/job-workflow';

type Service = ReturnType<typeof import('../services/job-workflow').default>;

const respond = async (ctx: any, fn: () => Promise<unknown>) => {
  try {
    ctx.body = { data: await fn() };
  } catch (error) {
    if (error instanceof ConflictError) {
      return ctx.conflict(error.message, error.details);
    }
    throw error;
  }
};

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const service = () => strapi.service('api::job.job-workflow') as unknown as Service;
  const actorOf = (ctx: any): Actor => {
    if (!ctx.state.user) throw new errors.UnauthorizedError('Silakan login terlebih dahulu');
    return ctx.state.user;
  };

  return {
    async me(ctx: any) {
      const actor = actorOf(ctx);
      const date = ctx.query.date ?? toWibDate();
      if (!isValidDate(date)) {
        throw new errors.ValidationError('Parameter date harus berformat YYYY-MM-DD');
      }
      const data = await service().findMine(actor, wibDayRange(date));
      ctx.body = { data, meta: { date, timezone: 'Asia/Jakarta' } };
    },

    async pending(ctx: any) {
      const actor = actorOf(ctx);
      const data = await service().findPending(actor);
      ctx.body = { data, meta: { active_shift: ctx.state.activeShift ?? null } };
    },

    async start(ctx: any) {
      const actor = actorOf(ctx);
      await respond(ctx, () => service().start(ctx.params.id, actor, { traceId: getTraceId(ctx) }));
    },

    async addNote(ctx: any) {
      const actor = actorOf(ctx);
      const note = ctx.request.body?.note;
      const max = service().NOTE_MAX_LENGTH;

      if (typeof note !== 'string' || !note.trim()) {
        throw new errors.ValidationError('note wajib berupa teks dan tidak boleh kosong');
      }
      if (note.trim().length > max) {
        throw new errors.ValidationError(`note maksimal ${max} karakter`);
      }

      await respond(ctx, () =>
        service().addNote(ctx.params.id, actor, note.trim(), { traceId: getTraceId(ctx) })
      );
    },

    async complete(ctx: any) {
      const actor = actorOf(ctx);
      await respond(ctx, () => service().complete(ctx.params.id, actor, { traceId: getTraceId(ctx) }));
    },

    async takeOver(ctx: any) {
      const actor = actorOf(ctx);
      await respond(ctx, () => service().takeOver(ctx.params.id, actor, { traceId: getTraceId(ctx) }));
    },
  };
};
