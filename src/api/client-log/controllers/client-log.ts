/**
 * client-log controller
 * Hanya field whitelist yang disimpan. Timestamp, IP, dan user agent diisi server.
 */

import { errors } from '@strapi/utils';
import { indexLog, LOG_INDEX } from '../../../utils/logger';

const MAX_BODY_BYTES = 5 * 1024;
const LEVELS = ['info', 'warn', 'error'] as const;

/** field body -> panjang maksimal */
const STRING_FIELDS = {
  event: 100,
  message: 1000,
  page: 300,
  component: 100,
  stack: 3000,
  trace_id: 100,
  client_timestamp: 40,
} as const;

type Field = keyof typeof STRING_FIELDS;

const bodySize = (ctx: any): number => {
  const header = Number(ctx.request.length);
  const parsed = Buffer.byteLength(JSON.stringify(ctx.request.body ?? {}));
  return Number.isFinite(header) && header > 0 ? Math.max(header, parsed) : parsed;
};

export default {
  async create(ctx: any) {
    if (bodySize(ctx) > MAX_BODY_BYTES) {
      return ctx.payloadTooLarge(`Log body must be at most ${MAX_BODY_BYTES} bytes`);
    }

    const body = ctx.request.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new errors.ValidationError('Body must be a JSON object');
    }

    if (!LEVELS.includes(body.level)) {
      throw new errors.ValidationError(`level must be one of: ${LEVELS.join(', ')}`);
    }
    if (typeof body.message !== 'string' || !body.message.trim()) {
      throw new errors.ValidationError('message is required');
    }

    const fields: Partial<Record<Field, string>> = {};
    for (const [key, max] of Object.entries(STRING_FIELDS) as [Field, number][]) {
      const value = body[key];
      if (value === undefined || value === null) continue;
      if (typeof value !== 'string' || value.length > max) {
        throw new errors.ValidationError(`${key} must be a string of at most ${max} characters`);
      }
      fields[key] = value;
    }

    let userId: string | undefined;
    if (body.user_id !== undefined && body.user_id !== null) {
      if (!['string', 'number'].includes(typeof body.user_id) || String(body.user_id).length > 50) {
        throw new errors.ValidationError('user_id is invalid');
      }
      userId = String(body.user_id);
    }

    const clientTime = fields.client_timestamp ? new Date(fields.client_timestamp) : undefined;
    const userAgent = ctx.request.headers['user-agent'];

    const doc = {
      '@timestamp': new Date().toISOString(),
      service: { name: 'erekap-fe' },
      log: { level: body.level },
      event: {
        action: fields.event ?? 'fe.log',
        ...(clientTime && !Number.isNaN(clientTime.getTime()) && { created: clientTime.toISOString() }),
      },
      message: fields.message,
      ...(fields.page && { url: { path: fields.page } }),
      ...(fields.component && { labels: { component: fields.component } }),
      ...(fields.stack && { error: { stack: fields.stack } }),
      ...(fields.trace_id && { trace: { id: fields.trace_id } }),
      // Dilaporkan oleh client, tidak diverifikasi.
      ...(userId && { user: { id: userId } }),
      client: { ip: ctx.request.ip },
      ...(typeof userAgent === 'string' && { user_agent: { original: userAgent.slice(0, 500) } }),
    };

    void indexLog(LOG_INDEX.fe, doc);

    ctx.status = 202;
    ctx.body = { data: { accepted: true } };
  },
};
