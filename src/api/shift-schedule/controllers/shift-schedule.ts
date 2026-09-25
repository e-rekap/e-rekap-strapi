/**
 * shift-schedule controller
 */

import { factories } from "@strapi/strapi";

const UID = "api::shift-schedule.shift-schedule";

export default factories.createCoreController(UID, ({ strapi }) => ({
  async myShifts(ctx) {
    const me = ctx.state.user; // user yang sedang login, diambil dari token
    const days = Number(ctx.query.days ?? 7); // ?days=7, default 7

    const data = await strapi.service(UID).findMyShifts(me.documentId, days);
    ctx.body = { data };
  },
}));