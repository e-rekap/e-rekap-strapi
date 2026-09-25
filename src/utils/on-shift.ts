import type { Core } from '@strapi/strapi';
import { addDays, shiftRange, toLocalDate } from './time';

export interface ActiveShift {
  scheduleId: string;
  shiftName: string;
  start: Date;
  end: Date;
}

/**
 * Cari shift user yang mencakup waktu `at` (WIB, Asia/Jakarta).
 * Jadwal kemarin ikut dicek karena shift malam bisa melewati tengah malam.
 */
export const findActiveShift = async (
  strapi: Core.Strapi,
  userId: number,
  at: Date = new Date()
): Promise<ActiveShift | null> => {
  const today = toLocalDate(at);

  const schedules = await strapi.db.query('api::shift-schedule.shift-schedule').findMany({
    where: {
      user: { id: userId },
      shiftDate: { $in: [addDays(today, -1), today] },
    },
    populate: { shift: true },
  });

  for (const schedule of schedules) {
    const shift = schedule.shift;
    if (!shift?.startTime || !shift?.endTime || !schedule.shiftDate) continue;

    const { start, end } = shiftRange(schedule.shiftDate, shift.startTime, shift.endTime);
    if (at >= start && at < end) {
      return { scheduleId: schedule.documentId, shiftName: shift.name, start, end };
    }
  }

  return null;
};
