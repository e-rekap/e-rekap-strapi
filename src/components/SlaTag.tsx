import { Tag } from "antd";
import type { JobStatus, SlaLabel } from "models/job";

const LABEL: Record<NonNullable<SlaLabel>, string> = {
  ON_TIME: "On Time",
  OVERDUE: "In Progress",
  LEWAT_DEADLINE: "Done",
};

const COLOR: Record<NonNullable<SlaLabel>, string> = {
  ON_TIME: "success",
  OVERDUE: "error",
  LEWAT_DEADLINE: "warning",
};

export default function JobStatusTag({ label }: { label: SlaLabel }) {
  if (!label) return <span>—</span>;
  return <Tag color={COLOR[label]}>{LABEL[label]}</Tag>;
}
