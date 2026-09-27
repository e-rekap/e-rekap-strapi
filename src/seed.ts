import type { Core } from "@strapi/strapi";
import { SHIFT_TYPES } from "./utils/shift";
import { scheduleKey } from "./utils/schedule";

const MEMBERS = [
  { name: "Budi" },
  { name: "Andi" },
  { name: "Sari" },
  { name: "Citra" },
  { name: "Eko" },
  { name: "Fajar" },
] as const;

export async function seedMembers(strapi: Core.Strapi) {
  if ((await strapi.documents("api::member.member").count({})) > 0) return;
  for (const data of MEMBERS)
    await strapi.documents("api::member.member").create({ data });
}

export async function seedShifts(strapi: Core.Strapi) {
  if ((await strapi.documents("api::shift.shift").count({})) > 0) return;
  for (const s of Object.values(SHIFT_TYPES)) {
    await strapi.documents("api::shift.shift").create({
      data: {
        name: s.label,
        startTime: `${s.start}:00.000`, // format time di Strapi: 'HH:mm:ss.SSS'
        endTime: `${s.end}:00.000`,
        order: s.order,
        crossesMidnight: s.crossesMidnight,
      },
    });
  }
}

export async function seedSchedules(strapi: Core.Strapi) {
  if (
    (await strapi.documents("api::shift-schedule.shift-schedule").count({})) > 0
  )
    return;

  const members = await strapi.documents("api::member.member").findMany({});
  const shifts = await strapi.documents("api::shift.shift").findMany({});
  const memberId = (name: string) =>
    members.find((m) => m.name === name)!.documentId;
  const shiftId = (name: string) =>
    shifts.find((s) => s.name === name)!.documentId;

  // Jadwal 20 Sep, sesuai data uji di dokumen edge case kamu
  const PLAN = [
    ["Budi", "Pagi"],
    ["Andi", "Pagi"],
    ["Sari", "Siang"],
    ["Citra", "Siang"],
    ["Eko", "Malam"],
  ];
  const date = "2026-09-20";
  for (const [m, s] of PLAN) {
    await strapi.documents("api::shift-schedule.shift-schedule").create({
      data: {
        shiftDate: date,
        member: memberId(m),
        shift: shiftId(s),
        memberDateKey: scheduleKey(memberId(m), date),
      },
    });
  }
}

const JOBS = [
  {
    title: "Pengecekan backup server",
    desc: "Cek backup DB & log harian",
    jobDate: "2026-09-20",
    deadline: "2026-09-20T12:00:00+07:00",
    jobStatus: "DONE",
    startedAt: "2026-09-20T08:00:00+07:00",
    completedAt: "2026-09-20T11:30:00+07:00",
  },
  {
    title: "Pembaruan data asset Gedung B",
    desc: "Update data asset lantai 1–3",
    jobDate: "2026-09-20",
    deadline: "2026-09-20T15:30:00+07:00",
    jobStatus: "IN_PROGRESS",
    startedAt: "2026-09-20T08:15:00+07:00",
  },
  {
    title: "Rekapitulasi tiket",
    desc: "Rekap tiket harian",
    jobDate: "2026-09-20",
    deadline: "2026-09-20T14:00:00+07:00",
    jobStatus: "DONE",
    startedAt: "2026-09-20T09:00:00+07:00",
    completedAt: "2026-09-20T14:20:00+07:00",
  },
  {
    title: "Cek log harian",
    desc: "Cek log aplikasi",
    jobDate: "2026-09-20",
    deadline: "2026-09-20T20:00:00+07:00",
    jobStatus: "NOT_STARTED",
  },
] as const;

export async function seedJobs(strapi: Core.Strapi) {
  const count = await strapi.documents("api::job.job").count({});
  if (count > 0) return; // udah ada data → jangan dobel

  for (const data of JOBS) {
    await strapi.documents("api::job.job").create({ data });
  }
  strapi.log.info(`Seeded ${JOBS.length} jobs`);
}
