/**
 * job controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::job.job', ({ strapi }) => {
  return {
    async find(ctx) {
    const { assigned_id, job_date_from, job_date_to, status, ...query } = ctx.query;

    ctx.query = query;
    await super.validateQuery(ctx);
    const sanitizedQuery = await super.sanitizeQuery(ctx);
    const filters = await strapi.service('api::job.job').buildListFilters({
      ...query,
      assigned_id,
      job_date_from,
      job_date_to,
      status,
    });
    const { results, pagination } = await strapi.service('api::job.job').find({
      ...sanitizedQuery,
      filters,
    });
    const sanitizedResults = await super.sanitizeOutput(results, ctx);

    return super.transformResponse(sanitizedResults, { pagination });
  },

  async create(ctx) {
    const result = await super.create(ctx);
    const job = result?.data;
    const jobCreatedBy = ctx.request.body?.data?.jobCreatedBy;
    const createdByUser = await strapi.service('api::job.job').getUserByUserId(jobCreatedBy);

    if (job?.documentId) {
      const now = new Date();
      await strapi.service('api::job.job').recordCrudHistory({
        documentId: job.documentId,
        actionType: 'CREATED',
        actorId: jobCreatedBy,
        description: `Job created by user ${createdByUser?.username ?? 'system'}`,
        status: job.jobStatus,
        at: now,
      });
    }

    return result;
  },

  async update(ctx) {
    const { id: documentId } = ctx.params as { id: string };
    const updateData = ctx.request.body?.data ?? {};
    const newStatus = updateData.jobStatus;
    const existingJob = await strapi.documents('api::job.job').findOne({
      documentId,
      fields: ['jobStatus', 'title'],
      populate: {
        jobCreatedBy: { fields: ['id', 'documentId', 'username'] },
        jobAssignedTo: { fields: ['documentId', 'username'] },
      },
    });
    const validationError = await strapi.service('api::job.job').validateUpdate(
      documentId,
      newStatus,
    );

    if (validationError) {
      if (validationError === 'Job is not found') {
        return ctx.notFound(validationError);
      }

      return ctx.badRequest(validationError);
    }

    const result = await super.update(ctx);
    const jobCreatedBy =
      ctx.request.body?.data?.jobCreatedBy ?? existingJob?.jobCreatedBy?.id;
    const createdByUser = await strapi.service('api::job.job').getUserByUserId(jobCreatedBy);

  if (result?.data) {
      const updatedJob = await strapi.documents('api::job.job').findOne({
        documentId,
        fields: ['jobStatus', 'title'],
        populate: { jobAssignedTo: { fields: ['documentId', 'username'] } },
      });
      const previousAssignee = existingJob?.jobAssignedTo as any;
      const currentAssignee = updatedJob?.jobAssignedTo as any;
      const isAssignment = previousAssignee?.documentId !== currentAssignee?.documentId;
      const isStatusChange =
        newStatus !== undefined && newStatus !== existingJob?.jobStatus;
      const now = new Date();

      await strapi.service('api::job.job').recordCrudHistory({
        documentId,
        actionType: isAssignment ? 'ASSIGNED' : 'EDITED',
        actorId: jobCreatedBy,
        previousUser: isAssignment ? previousAssignee?.documentId : undefined,
        description: isAssignment
          ? `Job ditugaskan kepada ${currentAssignee?.username ?? 'user'}`
          : isStatusChange
            ? `Job status diubah dari ${existingJob?.jobStatus} menjadi ${updatedJob?.jobStatus} oleh user ${createdByUser?.username ?? 'system'}`
            : `Job diperbarui oleh user ${createdByUser?.username ?? 'system'}`,
        status: updatedJob?.jobStatus,
        at: now,
      });
    }

    return result;
    },

  async delete(ctx) {
    const { id: documentId } = ctx.params as { id: string };
    const validationError = await strapi.service('api::job.job').validateDelete(documentId);

    if (validationError) {
      if (validationError === 'Job is not found') {
        return ctx.notFound(validationError);
      }

      return ctx.badRequest(validationError);
    }

    return super.delete(ctx);
  },
  };
});
