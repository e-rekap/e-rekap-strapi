/**
 * job router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::job.job', {
	config: {
		create: { middlewares: ['global::is-admin'] },
		update: { middlewares: ['global::is-admin'] },
		delete: { middlewares: ['global::is-admin'] },
	},
});
