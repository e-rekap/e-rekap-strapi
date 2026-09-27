import { useState } from "react";
import { Alert, Button, Space, Table, type TableProps } from "antd";
import { Link } from "react-router";
import useSWR from "swr";
import { useAuth } from "hooks/useAuth";
import { useJobActions } from "hooks/useJobActions";
import type { Job, StrapiList } from "models/job";
import { MY_JOBS_PATH } from "services/jobService";
import JobStatusTag from "components/JobStatusTag";
import SlaTag from "components/SlaTag";
import JobNoteModal, { type NoteMode } from "components/JobNoteModal";
import { formatDateTimeWIB } from "utils/format";

export default function MyJobsPage() {
  const { user } = useAuth();
  // ⚠️ Key-nya ikut nyimpen SIAPA user-nya, karena job Budi dan job Sari itu data yang beda
  const { data, error, mutate } = useSWR<StrapiList<Job>, Error>([
    MY_JOBS_PATH,
    user.id,
  ]);
  const actions = useJobActions(() => mutate());
  const [noteJob, setNoteJob] = useState<Job | null>(null);
  const [mode, setMode] = useState<NoteMode>("note");

  const openModal = (job: Job, m: NoteMode) => {
    setMode(m);
    setNoteJob(job);
  };

  const handleSubmit = async (text: string) => {
    if (!noteJob) return false;
    const ok =
      mode === "done"
        ? await actions.done(noteJob.documentId, text)
        : await actions.note(noteJob.documentId, text);
    if (ok) setNoteJob(null);
    return ok;
  };

  const columns: TableProps<Job>["columns"] = [
    {
      title: "Judul",
      dataIndex: "title",
      render: (v: string, row) => <Link to={row.documentId}>{v}</Link>,
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      render: (v: string) => formatDateTimeWIB(v),
    },
    {
      title: "Status",
      dataIndex: "jobStatus",
      render: (v: Job["jobStatus"]) => <JobStatusTag status={v} />,
    },
    {
      title: "SLA",
      dataIndex: "slaLabel",
      render: (v: Job["slaLabel"]) => <SlaTag label={v} />,
    },
    {
      title: "Aksi",
      render: (_, row) => (
        <Space>
          {row.actions?.includes("START") && (
            <Button
              size="small"
              type="primary"
              loading={actions.pendingId === row.documentId}
              onClick={() => actions.start(row.documentId)}
            >
              Start
            </Button>
          )}
          {row.actions?.includes("NOTE") && (
            <Button size="small" onClick={() => openModal(row, "note")}>
              Tambah catatan
            </Button>
          )}
          {row.actions?.includes("DONE") && (
            <Button
              size="small"
              type="primary"
              onClick={() => openModal(row, "done")}
            >
              Done
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (error) return <Alert type="error" message={error.message} />;
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button onClick={() => mutate()}>Refresh</Button>
      <Table
        rowKey="documentId"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={!data && !error}
        pagination={false}
      />
      <JobNoteModal
        job={noteJob}
        mode={mode}
        onClose={() => setNoteJob(null)}
        onSubmit={handleSubmit}
      />
    </Space>
  );
}
