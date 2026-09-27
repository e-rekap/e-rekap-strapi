import {
  Alert,
  App,
  Button,
  Popconfirm,
  Space,
  Table,
  type TableProps,
} from "antd";
import type { Job, StrapiList } from "models/job";
import JobStatusTag from "components/JobStatusTag";
import { formatDate, formatDateTimeWIB } from "utils/format";
import SlaTag from "components/SlaTag";
import useSWR from "swr";
import { useRecoilValue } from "recoil";
import { jobsKeySelector } from "atoms/jobFilters";
import JobFilterBar from "components/JobFiltersBar";
import { useState } from "react";
import { deleteJob } from "~/services/jobService";
import AssignJobModal from "~/components/AssignJobModal";
import JobFormModal from "~/components/JobFormModal";
import { Link } from "react-router";

export default function JobListPage() {
  const jobsKey = useRecoilValue(jobsKeySelector);
  const { data, error, mutate, isValidating } = useSWR<StrapiList<Job>, Error>(
    jobsKey,
  );

  const loading = !data && !error; // SWR 1.3 belum punya isLoading, jadi kita hitung sendiri

  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [assigningJob, setAssigningJob] = useState<Job | null>(null);
  const { message } = App.useApp();

  const handleDelete = async (documentId: string) => {
    try {
      await deleteJob(documentId);
      message.success("Job dihapus");
      mutate();
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const columns: TableProps<Job>["columns"] = [
    {
      title: "Tanggal",
      dataIndex: "jobDate",
      render: (v: string) => formatDate(v),
    },
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
    { title: "Assignee", render: (_, row) => row.assignee?.name ?? "—" },
    {
      title: "Aksi",
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            disabled={!row.canEdit}
            onClick={() => setAssigningJob(row)}
          >
            Assign
          </Button>
          <Button
            size="small"
            disabled={!row.canEdit}
            onClick={() => {
              setEditingJob(row);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus job ini?"
            okText="Hapus"
            cancelText="Batal"
            disabled={!row.canEdit}
            onConfirm={() => handleDelete(row.documentId)}
          >
            <Button size="small" danger disabled={!row.canEdit}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (error) return <Alert type="error" message={error.message} />;
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button onClick={() => mutate()} loading={isValidating}>
        {/*                  mutate() tanpa argumen artinya "ambil ulang data buat key ini". */}
        {/*                             isValidating bernilai true selama SWR lagi ngambil data, */}
        {/*                             termasuk yang diam-diam di belakang. */}
        Refresh
      </Button>
      <Button
        type="primary"
        onClick={() => {
          setEditingJob(null);
          setFormOpen(true);
        }}
      >
        + Job Baru
      </Button>
      <JobFilterBar />
      <Table
        rowKey="documentId"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={loading}
        pagination={false}
      />
      <JobFormModal
        open={formOpen}
        job={editingJob}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          mutate();
        }}
      />
      <AssignJobModal
        job={assigningJob}
        onClose={() => setAssigningJob(null)}
        onAssigned={() => {
          setAssigningJob(null);
          mutate();
        }}
      />
    </Space>
  );

  // before SWR

  // const { data, error, loading } = useFetch(getJobs);

  // if (error) return <Alert type="error" message={error.message} />;
  // return (
  //   <Table
  //     rowKey="documentId"
  //     columns={columns}
  //     dataSource={data?.data ?? []}
  //     loading={loading}
  //     pagination={false}
  //   />
  // );
}
