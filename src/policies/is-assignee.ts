/**
 * Policy `global::is-assignee`
 * Hanya assignee job (`jobAssignedTo`) yang boleh lanjut. Job diambil dari `params.id` (documentId).
 *
 * Config opsional: { rejectedAction: 'job.transition_rejected' } untuk nama event log saat ditolak.
 */

import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import { auditLog, getTraceId } from '../utils/logger';

export default async (policyContext: any, config: any, { strapi }: { strapi: Core.Strapi }) => {
  const user = policyContext.state?.user;
  const documentId = policyContext.params?.id;
  const rejectedAction = config?.rejectedAction ?? 'job.transition_rejected';
  const traceId = getTraceId(policyContext);

  if (!user) {
    throw new errors.UnauthorizedError('Please log in first');
  }

  const job = await strapi.db.query('api::job.job').findOne({
    where: { documentId },
    select: ['id', 'documentId', 'jobStatus'],
    populate: { jobAssignedTo: { select: ['id'] } },
  });

  if (!job) {
    auditLog({
      action: rejectedAction,
      level: 'warn',
      message: `Job ${documentId} not found`,
      user,
      jobId: documentId,
      traceId,
      labels: { reason: 'not_found', http_status: 404, route: policyContext.request?.path },
    });
    throw new errors.NotFoundError('Job not found');
  }

  if (job.jobAssignedTo?.id !== user.id) {
    auditLog({
      action: rejectedAction,
      level: 'warn',
      message: `${user.username} is not the assignee of job ${documentId}`,
      user,
      jobId: documentId,
      statusBefore: job.jobStatus,
      traceId,
      labels: { reason: 'not_assignee', http_status: 403, route: policyContext.request?.path },
    });
    throw new errors.PolicyError('Only the assignee can perform this action');
  }

  return true;
};
