import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ = "Asia/Jakarta";

export const SHIFT_TYPES = {
  PAGI: { start: "07:00", end: "15:30" },
  SIANG: { start: "15:00", end: "23:30" },
  MALAM: { start: "23:00", end: "07:30" },
} as const;

export type ShiftType = keyof typeof SHIFT_TYPES;

export function shiftWindow(date: string, shiftType: ShiftType) {
  const { start, end } = SHIFT_TYPES[shiftType];
  const startAt = dayjs.tz(`${date} ${start}`, TZ);
  let endAt = dayjs.tz(`${date} ${end}`, TZ);
  if (end <= start) endAt = endAt.add(1, "day"); // shift Malam selesai besok
  return { startAt, endAt };
}
