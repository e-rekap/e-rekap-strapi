/**
 * shift-schedule controller
 */

import { factories } from "@strapi/strapi";

const UID = "api::shift-schedule.shift-schedule";

export default factories.createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    const me = ctx.state.user;

    if (me?.role?.type === "user") {
      const days = Number(ctx.query.days ?? 7);
      const data = await strapi.service(UID).findMyShifts(me.documentId, days);
      ctx.body = { data };
      return;
    }

    // if admin == all data
    return super.find(ctx);
  },
}));