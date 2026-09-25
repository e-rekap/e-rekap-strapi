/**
 * job controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::job.job', ({ strapi }) => ({

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

  async update(ctx) {
    const { id: documentId } = ctx.params as { id: string };
    const newStatus = ctx.request.body?.data?.jobStatus;
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

    return super.update(ctx);
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
}));
