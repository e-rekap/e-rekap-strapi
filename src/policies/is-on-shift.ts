/**
 * Policy `global::is-on-shift`
 * User login harus punya shift (shift-schedule) yang mencakup waktu sekarang (waktu lokal server).
 * Shift aktif disimpan di `ctx.state.activeShift` untuk dipakai controller.
 *
 * Config opsional: { rejectedAction: 'job.take_over_rejected' } untuk nama event log saat ditolak.
 */

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { auditLog, getTraceId } from '../utils/logger';
import { findActiveShift } from '../utils/on-shift';

export default async (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
  const user = policyContext.state?.user;

  if (!user) {
    throw new errors.UnauthorizedError('Silakan login terlebih dahulu');
  }

  const activeShift = await findActiveShift(strapi, user.id);

  if (!activeShift) {
    auditLog({
      action: config?.rejectedAction ?? 'shift.not_on_shift',
      level: 'warn',
      message: `${user.username} tidak sedang on-shift`,
      user,
      jobId: policyContext.params?.id,
      traceId: getTraceId(policyContext),
      labels: { reason: 'not_on_shift', http_status: 403, route: policyContext.request?.path },
    });
    throw new errors.PolicyError('Aksi ini hanya untuk user yang sedang on-shift');
  }

  policyContext.state.activeShift = activeShift;
  return true;
};
