import type { Core } from '@strapi/strapi';
import { appLog } from '../utils/logger';

/** Mencatat error request API ke Elasticsearch tanpa mengubah response Strapi. */
export default (_config: unknown, _deps: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const level = error instanceof Error && error.name === 'ApplicationError' ? 'warn' : 'error';

      appLog(level, `${ctx.request.method} ${ctx.request.url} failed: ${message}`, error);
      throw error;
    }
  };
};