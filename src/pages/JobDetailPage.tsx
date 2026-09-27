import { Alert, Button, Card, Descriptions, Space, Spin } from "antd";
import { useNavigate, useParams } from "react-router";
import useSWR from "swr";
import type { Job, StrapiItem, StrapiList } from "models/job";
import type { JobHistory } from "models/jobHistory";
import { jobDetailKey, jobHistoryKey } from "services/jobService";
import JobStatusTag from "components/JobStatusTag";
import SlaTag from "components/SlaTag";
import JobTimeline from "components/JobTimeline";
import { formatDate, formatDateTimeWIB } from "utils/format";

export default function JobDetailPage() {
  const { id = "" } = useParams(); // documentId dari URL /jobs/:id
  const navigate = useNavigate();
  const { data: job, error } = useSWR<StrapiItem<Job>, Error>(jobDetailKey(id));
  const { data: histories } = useSWR<StrapiList<JobHistory>>(jobHistoryKey(id));

  if (error) return <Alert type="error" message={error.message} />;
  if (!job) return <Spin />;
  const j = job.data;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {/* relative: 'path' → naik satu segmen URL: /jobs/abc → /jobs */}
      <Button onClick={() => navigate("..", { relative: "path" })}>
        ← Kembali
      </Button>

      <Card title={j.title}>9
        <Descriptions
          column={2}
          items={[
            {
              key: "status",
              label: "Status",
              children: <JobStatusTag status={j.jobStatus} />,
            },
            {
              key: "sla",
              label: "SLA",
              children: <SlaTag label={j.slaLabel} />,
            },
            { key: "date", label: "Tanggal", children: formatDate(j.jobDate) },
            {
              key: "deadline",
              label: "Deadline",
              children: formatDateTimeWIB(j.deadline),
            },
            {
              key: "assignee",
              label: "Assignee",
              children: j.assignee?.name ?? "—",
            },
            { key: "notes", label: "Catatan", children: j.notes ?? "—" },
            { key: "desc", label: "Deskripsi", children: j.desc, span: 2 },
          ]}
        />
      </Card>

      <Card title="Timeline">
        <JobTimeline histories={histories?.data ?? []} />
      </Card>
    </Space>
  );
}
