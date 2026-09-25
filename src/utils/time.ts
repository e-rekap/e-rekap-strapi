/**
 * Helper waktu dengan timezone tetap `Asia/Jakarta` (WIB), tidak bergantung pada TZ server.
 * Semua tanggal (YYYY-MM-DD) dan jam shift dibaca sebagai waktu WIB.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TIMEZONE = 'Asia/Jakarta';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Tanggal WIB (YYYY-MM-DD) dari sebuah waktu. */
export const toLocalDate = (at: Date = new Date()): string =>
  dayjs(at).tz(TIMEZONE).format('YYYY-MM-DD');

export const isValidDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const addDays = (date: string, days: number): string =>
  dayjs(date).add(days, 'day').format('YYYY-MM-DD');

/** Gabungkan tanggal dan jam WIB (HH:mm atau HH:mm:ss[.SSS]) menjadi Date. */
export const localDateTime = (date: string, time: string): Date => {
  const [h = '00', mi = '00', s = '00'] = time.split('.')[0].split(':');
  return dayjs.tz(`${date} ${h.padStart(2, '0')}:${mi}:${s}`, TIMEZONE).toDate();
};

/** Rentang [start, end) satu hari penuh waktu WIB. */
export const localDayRange = (date: string): { start: Date; end: Date } => ({
  start: localDateTime(date, '00:00:00'),
  end: localDateTime(addDays(date, 1), '00:00:00'),
});

/** Format Date sebagai ISO dengan offset WIB, misal `2026-09-25T08:00:00+07:00`. */
export const formatLocal = (at: Date): string => dayjs(at).tz(TIMEZONE).format();

/**
 * Rentang waktu shift. Kalau jam selesai <= jam mulai (misal shift malam 23:00-07:30),
 * shift dianggap berakhir keesokan harinya.
 */
export const shiftRange = (
  shiftDate: string,
  startTime: string,
  endTime: string
): { start: Date; end: Date } => {
  const start = localDateTime(shiftDate, startTime);
  let end = localDateTime(shiftDate, endTime);
  if (end.getTime() <= start.getTime()) end = localDateTime(addDays(shiftDate, 1), endTime);
  return { start, end };
};
