import { useState } from "react";
import {
  Alert,
  App,
  Button,
  DatePicker,
  Popconfirm,
  Space,
  Table,
  type TableProps,
} from "antd";
import dayjs from "dayjs";
import useSWR from "swr";
import type { StrapiList } from "models/job";
import type { ShiftSchedule } from "models/shiftSchedule";
import {
  buildSchedulesKey,
  deleteSchedule,
} from "services/shiftScheduleService";
import AddScheduleModal from "components/AddScheduleModal";
import { formatDate } from "utils/format";

export default function ShiftSchedulePage() {
  const [date, setDate] = useState<string | null>(null); // filter tanggal: cukup state LOKAL
  const [modalOpen, setModalOpen] = useState(false);
  const { message } = App.useApp();
  const { data, error, mutate } = useSWR<StrapiList<ShiftSchedule>, Error>(
    buildSchedulesKey(date),
  );

  const handleDelete = async (documentId: string) => {
    try {
      await deleteSchedule(documentId);
      message.success("Jadwal dihapus");
      mutate(); // ambil ulang daftarnya
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const columns: TableProps<ShiftSchedule>["columns"] = [
    {
      title: "Tanggal",
      dataIndex: "shiftDate",
      render: (v: string) => formatDate(v),
    },
    { title: "User", render: (_, row) => row.member?.name ?? "—" },
    { title: "Shift", render: (_, row) => row.shift?.name ?? "—" },
    {
      title: "Aksi",
      render: (_, row) => (
        <Popconfirm
          title={`Hapus jadwal ${row.member?.name}?`}
          okText="Hapus"
          cancelText="Batal"
          onConfirm={() => handleDelete(row.documentId)}
        >
          <Button danger size="small">
            Hapus
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (error) return <Alert type="error" message={error.message} />;
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          + Tambah Shift
        </Button>
        <DatePicker
          placeholder="Filter tanggal"
          value={date ? dayjs(date) : null}
          onChange={(d) => setDate(d ? d.format("YYYY-MM-DD") : null)}
        />
      </Space>
      <Table
        rowKey="documentId"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={!data && !error}
        pagination={false}
      />
      <AddScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          mutate();
        }}
      />
    </Space>
  );
}
