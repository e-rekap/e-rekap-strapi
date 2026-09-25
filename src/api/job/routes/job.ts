/**
 * job router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::job.job', {
	config: {
    find: { middlewares: ['global::is-admin'] },
		findOne: { middlewares: ['global::is-admin'] },
		create: { middlewares: ['global::is-admin'] },
		update: { middlewares: ['global::is-admin'] },
		delete: { middlewares: ['global::is-admin'] },
	},
});
