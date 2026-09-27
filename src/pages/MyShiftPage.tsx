import { Alert, Table, Tag, theme, type TableProps } from "antd";
import useSWR from "swr";
import { useAuth } from "hooks/useAuth";
import type { MyShift } from "models/shiftSchedule";
import { MY_SHIFTS_PATH } from "services/shiftScheduleService";
import { formatDate } from "utils/format";

export default function MyShiftPage() {
  const { user } = useAuth();
  const { token } = theme.useToken(); // warna diambil dari tema antd, bukan hex manual
  const { data, error } = useSWR<{ data: MyShift[] }, Error>([
    MY_SHIFTS_PATH,
    user.id,
  ]);

  const columns: TableProps<MyShift>["columns"] = [
    {
      title: "Tanggal",
      dataIndex: "shiftDate",
      render: (v: string) => formatDate(v),
    },
    {
      title: "Shift",
      render: (_, r) =>
        r.shift
          ? `${r.shift.name} (${r.shift.startTime.slice(0, 5)}–${r.shift.endTime.slice(0, 5)})`
          : "—",
    },
    {
      title: "Status",
      dataIndex: "dutyStatus",
      render: (v: MyShift["dutyStatus"]) =>
        v === "ON_DUTY" ? (
          <Tag color="green">ON DUTY</Tag>
        ) : v === "DONE" ? (
          <Tag>Selesai</Tag>
        ) : null, // yang akan datang: kosong (mockup slide 30)
    },
  ];

  if (error) return <Alert type="error" message={error.message} />;
  return (
    <Table
      rowKey="documentId"
      columns={columns}
      dataSource={data?.data ?? []}
      loading={!data && !error}
      pagination={false}
      locale={{ emptyText: "Belum ada jadwal" }}
      onRow={(r) => ({
        style: r.isToday
          ? { background: token.colorPrimaryBg, fontWeight: 600 }
          : undefined,
      })}
    />
  );
}
