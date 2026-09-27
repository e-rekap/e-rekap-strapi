export type JobStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

const NEXT: Partial<Record<JobStatus, JobStatus>> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
};

// Boleh pindah dari status `from` ke `to`? (urutan gak boleh dilompatin atau mundur)
export const canTransition = (
  from: JobStatus | null | undefined,
  to: JobStatus,
) => from != null && NEXT[from] === to;

export type JobAction = "START" | "NOTE" | "DONE";

// Tombol apa aja yang boleh muncul buat status ini (BE yang mutusin, FE tinggal nampilin)
export function nextActions(status: JobStatus | null | undefined): JobAction[] {
  if (status === "NOT_STARTED") return ["START"];
  if (status === "IN_PROGRESS") return ["NOTE", "DONE"];
  return [];
}
