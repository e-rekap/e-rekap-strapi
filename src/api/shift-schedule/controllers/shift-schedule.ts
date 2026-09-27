/**
 * shift-schedule controller
 */

import { factories } from "@strapi/strapi";
import { scheduleKey } from "../../../utils/schedule";
import { getActorId } from "../../../utils/actor";
import { dutyStatusOf, todayWIB, windowOf } from "../../../utils/shift";

export default factories.createCoreController(
  "api::shift-schedule.shift-schedule",
  ({ strapi }) => ({
    async create(ctx) {
      const { member, shiftDate } = ctx.request.body.data ?? {};

      // Aturan 1: yang dijadwalin harus member dengan role USER, bukan ADMIN
      const m = await strapi
        .documents("api::member.member")
        .findOne({ documentId: member });
      if (!m) return ctx.badRequest("Member tidak ditemukan");

      // Aturan 2: 1 member cuma boleh 1 shift per tanggal
      const key = scheduleKey(member, shiftDate);
      const existing = await strapi
        .documents("api::shift-schedule.shift-schedule")
        .findFirst({
          filters: { memberDateKey: key },
        });
      if (existing) {
        return ctx.badRequest(`${m.name} sudah punya shift di ${shiftDate}`);
      }

      // Lolos semua → tempel kuncinya, terus lanjut pakai create bawaan Strapi
      ctx.request.body.data.memberDateKey = key;
      return super.create(ctx);
    },
    
    // GET /shift-schedules/mine → jadwal milik user yang manggil + status yang dihitung BE
    async mine(ctx) {
      const actorId = getActorId(ctx);
      if (!actorId) return ctx.unauthorized("Pilih user dulu");

      const schedules = await strapi
        .documents("api::shift-schedule.shift-schedule")
        .findMany({
          filters: { member: { documentId: actorId } },
          sort: "shiftDate:asc",
          populate: ["shift"],
        });

      const now = new Date();
      const today = todayWIB(now);
      return {
        data: schedules.map((s) => {
          const w =
            s.shift && typeof s.shiftDate === "string"
              ? windowOf(s.shiftDate, s.shift)
              : null;
          return {
            documentId: s.documentId,
            shiftDate: s.shiftDate,
            shift: s.shift,
            dutyStatus: w ? dutyStatusOf(w, now) : null,
            isToday: s.shiftDate === today,
          };
        }),
      };
    },
  }),
);