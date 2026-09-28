import type { Core } from '@strapi/strapi';
import { appLog } from '../utils/logger';

/**
 * Global middleware: mencatat setiap request POST/PUT/PATCH/DELETE
 * yang menyentuh endpoint /api/** ke content-type audit-log.
 *
 * Cara kerja singkat:
 * 1. Biarkan request diproses dulu (await next()).
 * 2. Kalau responnya sukses (status < 300) dan method-nya
 *    termasuk yang diaudit, ambil info dari ctx lalu simpan ke DB.
 * 3. Endpoint /api/audit-logs sendiri di-skip supaya tidak muter (log mencatat dirinya sendiri).
 *
 * Catatan: middleware ini menangkap traffic REST. Kalau kamu juga
 * pakai GraphQL atau perlu menangkap perubahan dari Admin Panel juga,
 * pertimbangkan tambahan strapi.db.lifecycles.subscribe (lihat README).
 */
export default (config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  const AUDITABLE_METHODS: Record<string, 'create' | 'update' | 'delete'> = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };

  return async (ctx: any, next: () => Promise<void>) => {
    await next();

    try {
      const { method } = ctx.request;
      const path: string = ctx.request.url.split('?')[0];

      const action = AUDITABLE_METHODS[method];
      if (!action) return;
      if (!path.startsWith('/api/')) return;
      if (path.startsWith('/api/audit-logs')) return;
      if (ctx.response.status >= 300) return;

      const segments = path.split('/').filter(Boolean);
      const content = segments[1] ?? 'unknown';
      const entityIdFromUrl = segments[2];
      const entityIdFromBody = ctx.response.body?.data?.id ?? ctx.response.body?.data?.documentId;

      const userId = ctx.request.data?.jobCreatedBy ?? ctx.state.user ?? ctx.request.user ?? 1;
      await strapi.db.query('api::audit-log.audit-log').create({
        data: {
          action,
          content,
          entityId: String(entityIdFromUrl ?? entityIdFromBody ?? ''),
          method,
          path,
          user: userId ? userId : null,
          payload: ctx.request.body ?? null,
          ip: ctx.request.ip,
        },
      });
    } catch (error) {
      appLog('error', '[audit-log middleware] failed to save log:', error);
    }
  };
};