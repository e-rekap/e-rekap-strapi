```
import type { MyJob, MyJobGroup } from "models/my-job";

/**
 * Data contoh untuk My Job List, bentuknya sama dengan hasil GET /api/my-job
 * setelah dipetakan lewat toMyJob(). Halaman sekarang memakai API,
 * jadi data ini hanya untuk mock, test, atau Storybook.
 */

const job = (data: Omit<MyJob, "actions">): MyJob => ({
  ...data,
  // Sama dengan aturan backend: NOT_STARTED → start, IN_PROGRESS → note/complete, DONE → tidak ada
  actions:
    data.status === "NOT_STARTED"
      ? ["start"]
      : data.status === "IN_PROGRESS"
        ? ["note", "complete"]
        : [],
});

export const initialJobGroups: MyJobGroup[] = [
  {
    date: "2026-09-24",
    jobs: [
      job({
        id: "k2x9a7m1q0sweep001kasir",
        title: "Sweeping area kasir",
        jobDate: "2026-09-24T01:00:00.000Z",
        status: "DONE",
        deadline: "2026-09-24T10:00:00+07:00",
        startedAt: "2026-09-24T09:30:00+07:00",
        completedAt: "2026-09-24T09:45:00+07:00",
        durationSeconds: 900, // 15 menit
        slaStatus: "ON_TIME",
      }),
      job({
        id: "p7d3c1v8n2backup002srv",
        title: "Pengecekan backup server",
        jobDate: "2026-09-24T01:00:00.000Z",
        status: "IN_PROGRESS",
        deadline: "2026-09-24T15:00:00+07:00",
        startedAt: "2026-09-24T13:20:00+07:00",
        completedAt: null,
        durationSeconds: null,
        slaStatus: "ON_TRACK", // belum lewat deadline
      }),
      job({
        id: "r5f6g2h9j4report003hrn",
        title: "Rekap laporan harian",
        jobDate: "2026-09-24T01:00:00.000Z",
        status: "DONE",
        deadline: "2026-09-24T12:00:00+07:00",
        startedAt: "2026-09-24T11:10:00+07:00",
        completedAt: "2026-09-24T12:25:00+07:00",
        durationSeconds: 4500, // 75 menit
        slaStatus: "OVERDUE", // selesai setelah deadline
      }),
    ],
  },
  {
    date: "2026-09-25",
    jobs: [
      job({
        id: "t1y8u4i6o3asset004gdgb",
        title: "Pembaruan data asset",
        jobDate: "2026-09-25T01:00:00.000Z",
        status: "NOT_STARTED",
        deadline: "2026-09-25T12:00:00+07:00",
        startedAt: null,
        completedAt: null,
        durationSeconds: null,
        slaStatus: "ON_TRACK",
      }),
      job({
        id: "w9e2r7t5y1stock005gdng",
        title: "Stock opname gudang",
        jobDate: "2026-09-25T01:00:00.000Z",
        status: "NOT_STARTED",
        deadline: "2026-09-25T08:00:00+07:00",
        startedAt: null,
        completedAt: null,
        durationSeconds: null,
        slaStatus: "OVERDUE", // belum dimulai tapi deadline sudah lewat
      }),
    ],
  },
];

```