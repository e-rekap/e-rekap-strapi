/**
 * shift-schedule router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter(
  "api::shift-schedule.shift-schedule",
  {
    config: {
      create: { middlewares: ["global::is-admin"] },
      update: { middlewares: ["global::is-admin"] }
    },
  },
);
