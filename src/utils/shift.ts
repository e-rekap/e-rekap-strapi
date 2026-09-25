import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ = "Asia/Jakarta";

const hhmm = (time: string) => time.slice(0, 5);

export function shiftWindow(
  date: string,
  shift: { startTime?: unknown; endTime?: unknown },
) {
  if (!shift.startTime || !shift.endTime) {
    throw new Error("Shift has no start or end time.");
  }

  const start = hhmm(String(shift.startTime));
  const end = hhmm(String(shift.endTime));
  const startAt = dayjs.tz(`${date} ${start}`, TZ);
  let endAt = dayjs.tz(`${date} ${end}`, TZ);
  if (end <= start) endAt = endAt.add(1, "day"); // shift melewati tengah malam (Malam)
  return { startAt, endAt };
}
