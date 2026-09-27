import { Alert, Button, Popconfirm, Space, Table, type TableProps } from "antd";
import { Link } from "react-router";
import useSWR from "swr";
import { useAuth } from "hooks/useAuth";
import { useJobActions } from "hooks/useJobActions";
import type { Job, StrapiList } from "models/job";
import { PENDING_PATH } from "services/jobService";
import JobStatusTag from "components/JobStatusTag";

export default function PendingPage() {
  const { user } = useAuth();
  const { data, error, mutate, isValidating } = useSWR<StrapiList<Job>, Error>([
    PENDING_PATH,
    user.id,
  ]);
  const actions = useJobActions(() => mutate());

  const columns: TableProps<Job>["columns"] = [
    {
      title: "Judul",
      dataIndex: "title",
      // relative="path": dari /pending naik satu segmen, terus masuk ke jobs/:id
      render: (v: string, row) => (
        <Link to={`../jobs/${row.documentId}`} relative="path">
          {v}
        </Link>
      ),
    },
    {
      title: "Sebelumnya dipegang oleh",
      render: (_, row) => row.assignee?.name ?? "—",
    },
    {
      title: "Status",
      dataIndex: "jobStatus",
      render: (v: Job["jobStatus"]) => <JobStatusTag status={v} />,
    },
    {
      title: "Catatan terakhir",
      dataIndex: "lastNote",
      render: (v: string | null) => v ?? "—",
    },
    {
      title: "Aksi",
      render: (_, row) => (
        <Popconfirm
          title={`Ambil alih job ${row.title}?`}
          okText="Ambil alih"
          cancelText="Batal"
          onConfirm={() => actions.takeOver(row.documentId)}
        >
          <Button
            size="small"
            type="primary"
            loading={actions.pendingId === row.documentId}
          >
            Take Over
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (error) return <Alert type="error" message={error.message} />;
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button onClick={() => mutate()} loading={isValidating}>
        Refresh
      </Button>
      <Table
        rowKey="documentId"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={!data && !error}
        pagination={false}
        locale={{ emptyText: "Gak ada job yang perlu diambil alih" }}
      />
    </Space>
  );
}
