import type { Core } from '@strapi/strapi';

/**
 * Permission route custom per tipe role users-permissions.
 * `/api/client-logs` tidak perlu di sini karena route-nya `auth: false` (Public).
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  authenticated: [
    'api::job.job-workflow.me',
    'api::job.job-workflow.pending',
    'api::job.job-workflow.start',
    'api::job.job-workflow.addNote',
    'api::job.job-workflow.complete',
    'api::job.job-workflow.takeOver',
  ],
};

ROLE_PERMISSIONS.user = ROLE_PERMISSIONS.authenticated;

const grantPermissions = async (strapi: Core.Strapi) => {
  for (const [type, actions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type } });
    if (!role) continue;

    for (const action of actions) {
      const exists = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: { id: role.id } } });
      if (!exists) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({ data: { action, role: role.id } });
        strapi.log.info(`Permission ${action} diberikan ke role ${type}`);
      }
    }
  }
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPermissions(strapi);
  },
};
