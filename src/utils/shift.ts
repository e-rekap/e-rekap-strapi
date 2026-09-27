export const TZ_OFFSET = "+07:00"; // WIB
export const MIN_REST_SHIFTS = 2;

type ShiftDef = {
  label: string;
  start: string; // 'HH:mm'
  end: string; // 'HH:mm'
  order: number; // urutan slot dalam sehari
  crossesMidnight: boolean;
};

export const SHIFT_TYPES = {
  PAGI: {
    label: "Pagi",
    start: "07:00",
    end: "15:30",
    order: 0,
    crossesMidnight: false,
  },
  SIANG: {
    label: "Siang",
    start: "15:00",
    end: "23:30",
    order: 1,
    crossesMidnight: false,
  },
  MALAM: {
    label: "Malam",
    start: "23:00",
    end: "07:30",
    order: 2,
    crossesMidnight: true,
  },
} as const satisfies Record<string, ShiftDef>;

export type ShiftType = keyof typeof SHIFT_TYPES; // 'PAGI' | 'SIANG' | 'MALAM'

export type ShiftWindow = { startAt: string; endAt: string };

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 'YYYY-MM-DD' → jumlah hari sejak 1970-01-01. Gak dipengaruhi timezone laptop.
function toDayNumber(date: string): number {
  if (!DATE_RE.test(date)) {
    throw new Error(`Format tanggal harus YYYY-MM-DD, dapat: "${date}"`);
  }
  const [y, m, d] = date.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d);
  // Date.UTC diam-diam "menggulung" tanggal invalid (30 Feb → 2 Mar), jadi cek bolak-balik
  if (new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new Error(`Tanggal tidak valid: "${date}"`);
  }
  return ms / DAY_MS;
}

function addDays(date: string, days: number): string {
  const ms = (toDayNumber(date) + days) * DAY_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

export function slotOf(date: string, type: ShiftType): number {
  return toDayNumber(date) * 3 + SHIFT_TYPES[type].order;
}

export function shiftWindow(date: string, type: ShiftType): ShiftWindow {
  const shift = SHIFT_TYPES[type];
  const endDate = shift.crossesMidnight
    ? addDays(date, 1)
    : (toDayNumber(date), date);
  return {
    startAt: `${date}T${shift.start}:00${TZ_OFFSET}`,
    endAt: `${endDate}T${shift.end}:00${TZ_OFFSET}`,
  };
}

export type DutyStatus = "DONE" | "ON_DUTY" | "UPCOMING";

// Kayak shiftWindow, tapi jamnya dibaca dari baris tabel Shift
type ShiftTimes = {
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  crossesMidnight?: boolean | null;
};

export function windowOf(date: string, s: ShiftTimes) {
  // Di runtime Strapi ngirim jam sebagai string 'HH:mm:ss.SSS'. Selain itu anggap gak valid
  if (typeof s.startTime !== "string" || typeof s.endTime !== "string")
    return null;

  const endDate = s.crossesMidnight ? addDays(date, 1) : date;
  return {
    startAt: `${date}T${s.startTime.slice(0, 5)}:00${TZ_OFFSET}`,
    endAt: `${endDate}T${s.endTime.slice(0, 5)}:00${TZ_OFFSET}`,
  };
}

// Belum mulai / lagi jalan / udah lewat? Dihitung pakai jam SERVER
export function dutyStatusOf(
  w: { startAt: string; endAt: string },
  now: Date,
): DutyStatus {
  const t = now.getTime();
  if (t < new Date(w.startAt).getTime()) return "UPCOMING";
  if (t <= new Date(w.endAt).getTime()) return "ON_DUTY";
  return "DONE";
}

// Tanggal hari ini menurut WIB, formatnya 'YYYY-MM-DD'. Format en-CA kebetulan persis kayak gitu
export function todayWIB(now: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    now,
  );
}
