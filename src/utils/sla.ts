export type SlaLabel = "ON_TIME" | "OVERDUE" | "LEWAT_DEADLINE" | null;

export function slaOf(
  job: { deadline: string; completedAt?: string | null },
  now: Date,
): SlaLabel {
  // TODO:
  // - Udah selesai (completedAt ada): completedAt ≤ deadline → 'ON_TIME', kalau lewat → 'OVERDUE'
  // - Belum selesai: now > deadline → 'LEWAT_DEADLINE', kalau belum → null

  if (job.completedAt != null) {
    if (job.completedAt <= job.deadline) {
      return "ON_TIME";
    } else {
      return "OVERDUE";
    }
  } else if (now.getTime.toString() > job.deadline) {
    return "LEWAT_DEADLINE";
  }

  return null;
}
