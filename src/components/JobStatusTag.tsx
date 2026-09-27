import { Tag } from "antd";
import type { JobStatus } from "models/job";

const LABEL: Record<JobStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};
const COLOR: Record<JobStatus, string> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "processing",
  DONE: "success",
};

export default function JobStatusTag({ status }: { status: JobStatus }) {
  return <Tag color={COLOR[status]}>{LABEL[status]}</Tag>;
}
