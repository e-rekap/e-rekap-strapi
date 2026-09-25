/**
 * job controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::job.job', ({ strapi }) => ({

  async update(ctx) {
    const { id: documentId } = ctx.params as { id: string };

    const existingJob = await strapi.documents('api::job.job').findOne({
      documentId,
      fields: ['jobStatus'],
    });

    if (!existingJob) {
      return ctx.notFound('Job is not found');
    }

    if (existingJob.jobStatus !== 'NOT_STARTED') {
      return ctx.badRequest('Job only can update if status is not started yet');
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const { id: documentId } = ctx.params as { id: string };

    const existingJob = await strapi.documents('api::job.job').findOne({
      documentId,
      fields: ['jobStatus'],
    });

    if (!existingJob) {
      return ctx.notFound('Job is not found');
    }

    if (existingJob.jobStatus !== 'NOT_STARTED') {
      return ctx.badRequest('Job only can delete if status is not started yet');
    }

    return super.delete(ctx);
  },
}));
