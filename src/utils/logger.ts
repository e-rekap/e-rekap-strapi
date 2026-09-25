/**
 * Logger ke Elasticsearch (dilihat lewat Kibana, data view `erekap-*`).
 *
 * - Pengiriman async dan fire-and-forget: kegagalan ES tidak pernah membuat request gagal,
 *   log jatuh ke console.
 * - Jangan pernah mengirim password, JWT, header Authorization, atau body request mentah.
 */

import { Client } from '@elastic/elasticsearch';

export const LOG_INDEX = {
  api: 'erekap-api-logs',
  audit: 'erekap-audit-logs',
  fe: 'erekap-fe-logs',
} as const;

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogUser {
  id?: number | string;
  username?: string;
  role?: { name?: string } | null;
}

export interface AuditEvent {
  action: string;
  level?: LogLevel;
  outcome?: 'success' | 'failure';
  message: string;
  user?: LogUser | null;
  jobId?: string;
  shiftId?: string;
  statusBefore?: string | null;
  statusAfter?: string | null;
  traceId?: string;
  labels?: Record<string, string | number | boolean | null | undefined>;
  error?: unknown;
}

let client: Client | null | undefined;

const getClient = (): Client | null => {
  if (client !== undefined) return client;

  const node = process.env.ELASTICSEARCH_NODE;
  if (!node) {
    client = null;
    return client;
  }

  const apiKey = process.env.ELASTICSEARCH_API_KEY;
  const username = process.env.ELASTICSEARCH_USERNAME;
  const password = process.env.ELASTICSEARCH_PASSWORD;

  client = new Client({
    node,
    auth: apiKey ? { apiKey } : username ? { username, password: password ?? '' } : undefined,
    requestTimeout: 3000,
    maxRetries: 1,
  });
  return client;
};

const fallback = (index: string, doc: Record<string, unknown>, reason?: unknown) => {
  const line = `[${index}] ${JSON.stringify(doc)}`;
  const log = (globalThis as any).strapi?.log;
  if (reason) {
    const why = reason instanceof Error ? reason.message : String(reason);
    log ? log.warn(`Elasticsearch log gagal (${why}) ${line}`) : console.warn(why, line);
  } else {
    log ? log.info(line) : console.info(line);
  }
};

/** Kirim satu dokumen ke index ES. Tidak pernah throw dan tidak perlu di-await. */
export const indexLog = (index: string, doc: Record<string, unknown>): Promise<void> => {
  const es = getClient();
  if (!es) {
    fallback(index, doc);
    return Promise.resolve();
  }
  return es
    .index({ index, document: doc })
    .then(() => undefined)
    .catch((err) => fallback(index, doc, err));
};

const clean = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));

/** Event bisnis, format domain.aksi (misal `job.taken_over`) ke `erekap-audit-logs`. */
export const auditLog = (event: AuditEvent): Promise<void> => {
  const level = event.level ?? 'info';
  const err = event.error instanceof Error ? event.error : undefined;

  const doc = {
    '@timestamp': new Date().toISOString(),
    service: { name: 'erekap-be' },
    log: { level },
    event: clean({ action: event.action, outcome: event.outcome ?? (level === 'info' ? 'success' : 'failure') }),
    trace: event.traceId ? { id: event.traceId } : undefined,
    user: event.user
      ? clean({ id: event.user.id, name: event.user.username, role: event.user.role?.name })
      : undefined,
    job: event.jobId ? { id: event.jobId } : undefined,
    shift: event.shiftId ? { id: event.shiftId } : undefined,
    labels: clean({
      status_before: event.statusBefore,
      status_after: event.statusAfter,
      ...(event.labels ?? {}),
    }),
    message: event.message,
    error:
      level === 'error' && err ? { message: err.message, stack: err.stack } : undefined,
  };

  return indexLog(LOG_INDEX.audit, clean(doc));
};

/** Ambil trace id dari middleware request-logger (kalau ada) atau header X-Request-Id. */
export const getTraceId = (ctx: any): string | undefined => {
  const fromState = ctx?.state?.requestId;
  const fromHeader = ctx?.request?.headers?.['x-request-id'];
  const id = fromState ?? fromHeader;
  return typeof id === 'string' && id.length <= 100 ? id : undefined;
};
