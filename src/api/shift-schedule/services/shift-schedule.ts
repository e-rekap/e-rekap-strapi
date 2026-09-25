/**
 * shift-schedule service
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { addDays, formatLocal, shiftRange, toLocalDate } from "../../../utils/time";

const { ApplicationError } = errors;
const UID = "api::shift-schedule.shift-schedule";

export default factories.createCoreService(UID, ({ strapi }) => ({
  async create(params: any) {
    const data = params.data ?? {};
    const { shiftDate, shift, user } = data;

    // 1. Field wajib
    if (!shiftDate || !shift || !user) {
      throw new ApplicationError("Shift date, shift, and user are required.");
    }

    // 2. Shift harus ada
    const shiftEntry = await strapi
      .documents("api::shift.shift")
      .findOne({ documentId: shift });
    if (!shiftEntry) throw new ApplicationError("Shift not found.");

    // 3. User harus ada dan ber-role User
    const person = await strapi
      .documents("plugin::users-permissions.user")
      .findOne({
        documentId: user,
        populate: ["role"],
      });
    if (!person) throw new ApplicationError("User not found.");
    if (person.role?.type !== "user") {
      throw new ApplicationError(
        "Only users with the User role can be scheduled.",
      );
    }

    // 4. Shift belum boleh mulai
    if (!shiftEntry.startTime || !shiftEntry.endTime) {
      throw new ApplicationError("Shift has no start or end time.");
    }
    const { start } = shiftRange(shiftDate, String(shiftEntry.startTime), String(shiftEntry.endTime));
    if (Date.now() >= start.getTime()) {
      throw new ApplicationError("This shift has already started or ended.");
    }

    // 5. 1 user 1 shift per tanggal
    const existing = await strapi.documents(UID).findFirst({
      filters: {
        user: { documentId: { $eq: user } },
        shiftDate: { $eq: shiftDate },
      },
    });
    if (existing) {
      throw new ApplicationError(
        `${person.username} already has a shift on ${shiftDate}.`,
      );
    }

    return super.create(params);
  },

  async findMyShifts(userDocumentId: string, days: number) {
    const today = toLocalDate();
    const from = addDays(today, -1);
    const to = addDays(today, days);

    const rows: any[] = await strapi.documents(UID).findMany({
      filters: {
        user: { documentId: { $eq: userDocumentId } },
        shiftDate: { $gte: from, $lte: to },
      },
      populate: ["shift"],
      sort: "shiftDate:asc",
    });

    const now = Date.now();
    return rows.flatMap((row) => {
      if (!row.shiftDate || !row.shift?.startTime || !row.shift?.endTime) return []; // data tidak lengkap → lewati

      const shiftDate = String(row.shiftDate);
      const { start, end } = shiftRange(shiftDate, String(row.shift.startTime), String(row.shift.endTime));
      const phase = now < start.getTime()
        ? "UPCOMING"
        : now < end.getTime()
          ? "ONGOING"
          : "ENDED";

      return [
        {
          shiftDate,
          shift: row.shift.name,
          startAt: formatLocal(start),
          endAt: formatLocal(end),
          phase,
        },
      ];
    });
  },
}));
