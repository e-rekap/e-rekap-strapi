/**
 * Helper waktu berdasarkan timezone lokal server (env `TZ`, misal `TZ=Asia/Makassar`).
 * Semua tanggal (YYYY-MM-DD) dan jam shift dibaca sebagai waktu lokal server.
 */

/** Nama timezone lokal server, misal `Asia/Jakarta`. */
export const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');

const parseDate = (date: string): [number, number, number] => {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
};

/** Tanggal lokal (YYYY-MM-DD) dari sebuah waktu. */
export const toLocalDate = (at: Date = new Date()): string =>
  `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;

export const isValidDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const addDays = (date: string, days: number): string => {
  const [y, m, d] = parseDate(date);
  return toLocalDate(new Date(y, m - 1, d + days));
};

/** Gabungkan tanggal dan jam lokal (HH:mm atau HH:mm:ss[.SSS]) menjadi Date. */
export const localDateTime = (date: string, time: string): Date => {
  const [y, m, d] = parseDate(date);
  const [h = 0, mi = 0, s = 0] = time.split('.')[0].split(':').map(Number);
  return new Date(y, m - 1, d, h, mi, s);
};

/** Rentang [start, end) satu hari penuh waktu lokal. */
export const localDayRange = (date: string): { start: Date; end: Date } => ({
  start: localDateTime(date, '00:00:00'),
  end: localDateTime(addDays(date, 1), '00:00:00'),
});

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
