import type { JobStatus } from "./job-status"; // ← ganti baris `type JobStatus = ...`

// Aturan PPT: job cuma boleh diedit/dihapus/di-assign kalau masih Not Started
export const canEditJob = (job: { jobStatus?: JobStatus | null }) =>
  job.jobStatus === "NOT_STARTED";

// Aturan PPT: belum Done + udah ada pemegangnya + pemegangnya BUKAN kamu
export function canTakeOver(
  job: {
    jobStatus?: JobStatus | null;
    assignee?: { documentId: string } | null;
  },
  actorId: string,
) {
  const active =
    job.jobStatus === "NOT_STARTED" || job.jobStatus === "IN_PROGRESS";
  return active && !!job.assignee && job.assignee.documentId !== actorId;
}
