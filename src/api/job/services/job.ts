/**
 * job service
 */

import { factories } from '@strapi/strapi';

const statusOrder = ['NOT_STARTED', 'IN_PROGRESS', 'DONE'];

export default factories.createCoreService('api::job.job', ({ strapi }) => ({
	async buildListFilters(query: Record<string, any>) {
		const {
			status,
			assigned_id: assignedId,
			job_date_from: jobDateFrom,
			job_date_to: jobDateTo,
		} = query;
		let assignedUserDocumentId: string | undefined;

		if (assignedId) {
			const assignedUser = await strapi.db
				.query('plugin::users-permissions.user')
				.findOne({
					where: { id: assignedId },
					select: ['documentId'],
				});
			assignedUserDocumentId = assignedUser?.documentId;
		}

		return {
			...(query.filters || {}),
			...(status ? { jobStatus: { $eq: status } } : {}),
			...(assignedId
				? {
						jobAssignedTo: {
							documentId: { $eq: assignedUserDocumentId || '__not_found__' },
						},
					}
				: {}),
			...((jobDateFrom || jobDateTo)
				? {
						jobCreatedAt: {
							...(jobDateFrom ? { $gte: jobDateFrom } : {}),
							...(jobDateTo ? { $lte: jobDateTo } : {}),
						},
					}
				: {}),
		};
	},

	async validateUpdate(documentId: string, newStatus?: string) {
		const existingJob = await strapi.documents('api::job.job').findOne({
			documentId,
			fields: ['jobStatus'],
		});

		if (!existingJob) {
			return 'Job is not found';
		}

		if (existingJob.jobStatus !== 'NOT_STARTED') {
			return 'Job only can update if status is not started yet';
		}

		if (newStatus) {
			const currentIndex = statusOrder.indexOf(existingJob.jobStatus);
			const newIndex = statusOrder.indexOf(newStatus);

			if (newIndex === -1) {
				return 'Invalid job status';
			}

			if (newIndex !== currentIndex + 1) {
				return `Job status must be updated sequentially. Current status is ${existingJob.jobStatus}, next allowed status is ${statusOrder[currentIndex + 1]}`;
			}
		}

		return null;
	},

	async validateDelete(documentId: string) {
		const existingJob = await strapi.documents('api::job.job').findOne({
			documentId,
			fields: ['jobStatus'],
		});

		if (!existingJob) {
			return 'Job is not found';
		}

		if (existingJob.jobStatus !== 'NOT_STARTED') {
			return 'Job only can delete if status is not started yet';
		}

		return null;
	},
}));
