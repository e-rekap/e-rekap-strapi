/**
 * shift-schedule service
 */

import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import dayjs from "dayjs";
import { SHIFT_TYPES, shiftWindow, ShiftType, TZ } from "../../../utils/shift";

const { ApplicationError } = errors;
const UID = "api::shift-schedule.shift-schedule";

export default factories.createCoreService(UID, ({ strapi }) => ({
  async create(params: any) {
    const data = params.data ?? {};
    const { date, shiftType, user } = data;

    // 1. Field wajib
    if (!date || !shiftType || !user) {
      throw new ApplicationError("Tanggal, shift, dan user wajib diisi.");
    }
    if (!(shiftType in SHIFT_TYPES)) {
      throw new ApplicationError("Tipe shift tidak valid.");
    }

    // 2. User harus ada dan ber-role User
    const person = await strapi
      .documents("plugin::users-permissions.user")
      .findOne({
        documentId: user,
        populate: ["role"],
      });
    if (!person) throw new ApplicationError("User tidak ditemukan.");
    if (person.role?.type !== "user") {
      throw new ApplicationError(
        "Hanya user dengan role User yang bisa dijadwalkan.",
      );
    }

    // 3. Shift belum boleh mulai
    const { startAt } = shiftWindow(date, shiftType as ShiftType);
    if (!dayjs().isBefore(startAt)) {
      throw new ApplicationError("Shift ini sudah mulai atau sudah lewat.");
    }

    // 4. 1 user 1 shift per tanggal
    const userDateKey = `${user}_${date}`;
    const existing = await strapi
      .documents(UID)
      .findFirst({ filters: { userDateKey } });
    if (existing) {
      throw new ApplicationError(
        `${person.username} sudah punya shift di tanggal ${date}.`,
      );
    }

    // Lolos semua cek: isi userDateKey otomatis, lalu simpan
    data.userDateKey = userDateKey;
    return super.create(params);
  },

  async findMyShifts(userDocumentId: string, days: number) {
    const today = dayjs().tz(TZ);
    const from = today.subtract(1, "day").format("YYYY-MM-DD"); // kemarin, supaya Malam kemarin ikut
    const to = today.add(days, "day").format("YYYY-MM-DD");

    const rows = await strapi.documents(UID).findMany({
      filters: {
        user: { documentId: { $eq: userDocumentId } },
        date: { $gte: from, $lte: to },
      },
      sort: "date:asc",
    });

    const now = dayjs();
    return rows.flatMap((row) => {
      if (!row.date || !row.shiftType) return []; // data tidak lengkap → lewati

      const date = String(row.date); // di sini TypeScript sudah tahu date pasti ada
      const shiftType = row.shiftType as ShiftType;
      const { startAt, endAt } = shiftWindow(date, shiftType);
      const phase = now.isBefore(startAt)
        ? "UPCOMING"
        : now.isBefore(endAt)
          ? "ONGOING"
          : "ENDED";

      return [
        {
          date,
          shiftType,
          startAt: startAt.format(),
          endAt: endAt.format(),
          phase,
        },
      ];
    });
  },
}));
