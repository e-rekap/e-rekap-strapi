// import type { Core } from '@strapi/strapi';

import type { Core } from "@strapi/strapi";
import { seedJobs, seedMembers, seedSchedules, seedShifts } from "./seed";

export default {
  register() {},
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedJobs(strapi);
    await seedMembers(strapi);
    await seedShifts(strapi);
    await seedSchedules(strapi);
  },
};