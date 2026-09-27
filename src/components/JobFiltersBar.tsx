import { Badge, Button, DatePicker, Select, Space } from "antd";
import dayjs from "dayjs";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import { activeFilterCountSelector, jobFiltersAtom } from "atoms/jobFilters";

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export default function JobFilterBar() {
  const [filters, setFilters] = useRecoilState(jobFiltersAtom); // baca + ubah
  const activeCount = useRecoilValue(activeFilterCountSelector); // baca aja
  const resetFilters = useResetRecoilState(jobFiltersAtom); // balikin ke default

  return (
    <Space>
      <Select
        allowClear
        placeholder="Semua status"
        style={{ width: 160 }}
        options={STATUS_OPTIONS}
        value={filters.status ?? undefined}
        onChange={(status) =>
          setFilters({ ...filters, status: status ?? null })
        }
      />
      <DatePicker
        placeholder="Semua tanggal"
        value={filters.date ? dayjs(filters.date) : null}
        onChange={(d) =>
          setFilters({ ...filters, date: d ? d.format("YYYY-MM-DD") : null })
        }
      />
      <Badge count={activeCount}>
        <Button onClick={resetFilters}>Reset filter</Button>
      </Badge>
    </Space>
  );
}
