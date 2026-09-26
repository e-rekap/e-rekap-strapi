/**
 * job service
 */

import { factories } from '@strapi/strapi';

const statusOrder = ['NOT_STARTED', 'IN_PROGRESS', 'DONE'];
const HISTORY = 'api::job-history.job-history';

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

	async validateUpdate(documentId: string, newStatus?: string, hasDataChanges = false) {
		const existingJob = await strapi.documents('api::job.job').findOne({
			documentId,
			fields: ['jobStatus'],
		});

		if (!existingJob) {
			return 'Job is not found';
		}

		if (hasDataChanges && existingJob.jobStatus !== 'NOT_STARTED') {
			return 'Job only can update if status is not started yet';
		}

		if (newStatus) {
			const currentIndex = statusOrder.indexOf(existingJob.jobStatus ?? '');
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

	async recordCrudHistory(data: {
		documentId: string;
		actionType: 'CREATED' | 'ASSIGNED' | 'EDITED';
		actorId?: number;
		previousUser?: string;
		description: string;
		status?: string | null;
		at: Date;
	}) {
		const actor = data.actorId
			? await strapi.db.query('plugin::users-permissions.user').findOne({
					where: { id: data.actorId },
					select: ['documentId'],
				})
			: null;

		const indicatorColor = data.status === 'DONE'
			? 'GREEN'
			: data.status === 'IN_PROGRESS'
				? 'ORANGE'
				: 'BLUE';

		return strapi.documents(HISTORY).create({
			data: {
				job: data.documentId,
				actionType: data.actionType,
				...(actor?.documentId ? { user: actor.documentId } : {}),
				...(data.previousUser ? { previousUser: data.previousUser } : {}),
				description: data.description,
				indicatorColor,
				jobHistoryCreatedAt: data.at.toISOString(),
			} as any,
		});
	},

	async getUserByUserId(userId?: number) {
		if (!userId) return null;

		return strapi.db.query('plugin::users-permissions.user').findOne({
			where: { id: userId },
			select: ['username', 'documentId'],
		});
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
