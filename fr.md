src/models/take-over-job.ts
```
import type { JobStatus, SlaStatus } from "./my-job";

export type TakeOverStatus = Exclude<JobStatus, "DONE">;

export interface UserRef {
  id: number;
  name: string;
}

/** Bentuk persis dari GET /api/my-job/pending */
export interface TakeOverJobResponse {
  id: string;
  title: string;
  job_date: string;
  deadline: string;
  status: TakeOverStatus;
  sla_status: SlaStatus;
  started_at: string | null;
  previous_assignee: UserRef;
  last_note: { note: string; created_at: string; by: UserRef | null } | null;
  actions: ["take_over"];
}

/** Shift user login yang sedang aktif (meta.active_shift) */
export interface ActiveShift {
  scheduleId: string;
  shiftName: string;
  start: string;
  end: string;
}

/** Model untuk UI */
export interface TakeOverJob {
  id: string;
  title: string;
  deadline: string;
  status: TakeOverStatus;
  slaStatus: SlaStatus;
  startedAt: string | null;
  previousOwner: UserRef;
  note: string | null;
  noteAt: string | null;
  noteBy: UserRef | null;
}

export const toTakeOverJob = (r: TakeOverJobResponse): TakeOverJob => ({
  id: r.id,
  title: r.title,
  deadline: r.deadline,
  status: r.status,
  slaStatus: r.sla_status,
  startedAt: r.started_at,
  previousOwner: r.previous_assignee,
  note: r.last_note?.note ?? null,
  noteAt: r.last_note?.created_at ?? null,
  noteBy: r.last_note?.by ?? null,
});
```

src/services/take-over-job.ts
```
import { api } from "services/api"; // sesuaikan path instance axios bersama
import {
  toTakeOverJob,
  type ActiveShift,
  type TakeOverJob,
  type TakeOverJobResponse,
} from "models/take-over-job";

export interface PendingJobsResult {
  jobs: TakeOverJob[];
  activeShift: ActiveShift | null;
}

export const getPendingJobs = async (): Promise<PendingJobsResult> => {
  const res = await api.get<{
    data: TakeOverJobResponse[];
    meta: { active_shift: ActiveShift | null };
  }>("/my-job/pending");

  return {
    jobs: res.data.data.map(toTakeOverJob),
    activeShift: res.data.meta.active_shift,
  };
};

export const takeOverJob = (id: string) => api.post(`/my-job/${id}/take-over`);
```

src/hooks/usePendingJobs.ts
```
import { useCallback, useEffect, useState } from "react";
import { getPendingJobs, type PendingJobsResult } from "services/take-over-job";

export function usePendingJobs() {
  const [result, setResult] = useState<PendingJobsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await getPendingJobs());
    } catch (e) {
      setError(e);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // 403 dari backend = user tidak sedang on-shift
  const notOnShift = (error as any)?.response?.status === 403;

  return { result, loading, error, notOnShift, refetch };
}
```

src/pages/take-over-job/TakeOverModal.tsx
```
import { useState } from "react";
import dayjs from "dayjs";
import { Button, Flex, Modal, Popconfirm, Tag } from "one-web-components-react";
import type { TakeOverJob, TakeOverStatus } from "models/take-over-job";

const STATUS_LABEL: Record<TakeOverStatus, string> = {
  NOT_STARTED: "NOT START",
  IN_PROGRESS: "IN PROG",
};

const STATUS_TAG_COLOR: Record<TakeOverStatus, string> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "processing",
};

interface Props {
  open: boolean;
  job: TakeOverJob | null;
  onCancel: () => void;
  /** Halaman yang memanggil API */
  onConfirm: (job: TakeOverJob) => Promise<void>;
}

export default function TakeOverModal({ open, job, onCancel, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);

  if (!job) return null;

  const handleCancel = () => {
    if (!submitting) onCancel();
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(job);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Take Over: ${job.title}`}
      open={open}
      onCancel={handleCancel}
      width={520}
      maskClosable={!submitting}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>,
        <Popconfirm
          key="confirm"
          title="Are you sure?"
          description={`Job ini akan dipindahkan ke "My Job List" Anda.`}
          okText="Yes"
          cancelText="No"
          onConfirm={handleConfirm}
        >
          <Button type="primary" loading={submitting}>
            Confirm Take Over
          </Button>
        </Popconfirm>,
      ]}
    >
      <Flex vertical gap="middle">
        <div>
          <span style={{ color: "#666" }}>Sebelumnya: </span>
          <span style={{ fontWeight: 600 }}>{job.previousOwner.name}</span>
        </div>

        {job.note && (
          <div>
            <span style={{ color: "#666" }}>
              Catatan {job.noteBy?.name ?? job.previousOwner.name}
              {job.noteAt && ` (${dayjs(job.noteAt).format("DD MMM HH:mm")})`}:{" "}
            </span>
            <span style={{ color: "#333" }}>"{job.note}"</span>
          </div>
        )}

        <div>
          <span style={{ color: "#666" }}>Status: </span>
          <Tag color={STATUS_TAG_COLOR[job.status]}>{STATUS_LABEL[job.status]}</Tag>
          {job.startedAt && (
            <span style={{ color: "#999" }}> (sejak {dayjs(job.startedAt).format("HH:mm")})</span>
          )}
        </div>

        <div>
          <span style={{ color: "#666" }}>Deadline: </span>
          <span style={{ fontWeight: 500, color: job.slaStatus === "OVERDUE" ? "#ff4d4f" : undefined }}>
            {dayjs(job.deadline).format("DD MMM HH:mm")}
          </span>
        </div>

        <div style={{ color: "#999", fontSize: 12 }}>
          Status job tidak berubah. Catatan sebelumnya tetap tersimpan di riwayat job.
        </div>
      </Flex>
    </Modal>
  );
}
```

src/pages/take-over-job/index.tsx
```
import { useState } from "react";
import dayjs from "dayjs";
import { Button, Card, Flex, Table, Tag, message } from "one-web-components-react";
import type { TableProps } from "one-web-components-react";
import TakeOverModal from "./TakeOverModal";
import type { TakeOverJob, TakeOverStatus } from "models/take-over-job";
import type { SlaStatus } from "models/my-job";
import { usePendingJobs } from "hooks/usePendingJobs";
import { takeOverJob } from "services/take-over-job";
import { apiErrorMessage } from "services/my-job";

const STATUS_LABEL: Record<TakeOverStatus, string> = {
  NOT_STARTED: "NOT START",
  IN_PROGRESS: "IN PROG",
};

const STATUS_TAG_COLOR: Record<TakeOverStatus, string> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "processing",
};

const SLA_TAG_COLOR: Record<SlaStatus, string> = {
  ON_TIME: "success",
  OVERDUE: "error",
  ON_TRACK: "processing",
};
const SLA_LABEL: Record<SlaStatus, string> = {
  ON_TIME: "On Time",
  OVERDUE: "Overdue",
  ON_TRACK: "On Track",
};

function buildColumns(onOpenModal: (job: TakeOverJob) => void): TableProps<TakeOverJob>["columns"] {
  return [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: TakeOverJob) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.note && (
            <div style={{ fontSize: 12, color: "#999" }}>(catatan: {record.note})</div>
          )}
        </div>
      ),
    },
    {
      title: "Sebelumnya",
      key: "previous",
      width: 160,
      render: (_: unknown, record: TakeOverJob) => (
        <span style={{ fontWeight: 500 }}>{record.previousOwner.name}</span>
      ),
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      width: 150,
      render: (deadline: string, record: TakeOverJob) => (
        <Flex vertical gap={2}>
          <span style={{ color: record.slaStatus === "OVERDUE" ? "#ff4d4f" : "#333" }}>
            {dayjs(deadline).format("DD MMM HH:mm")}
          </span>
          <Tag color={SLA_TAG_COLOR[record.slaStatus]} style={{ width: "fit-content" }}>
            {SLA_LABEL[record.slaStatus]}
          </Tag>
        </Flex>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: TakeOverStatus) => (
        <Tag color={STATUS_TAG_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      render: (_: unknown, record: TakeOverJob) => (
        <Button type="primary" size="small" onClick={() => onOpenModal(record)}>
          Take Over
        </Button>
      ),
    },
  ];
}

export default function TakeOverJobPage() {
  const { result, loading, error, notOnShift, refetch } = usePendingJobs();
  const [modalJob, setModalJob] = useState<TakeOverJob | null>(null);

  const handleConfirm = async (job: TakeOverJob) => {
    try {
      await takeOverJob(job.id);
      message.success(`Job "${job.title}" berhasil diambil alih`);
    } catch (e) {
      // 409 = job sudah selesai atau sudah diambil orang lain, 403 = shift sudah berakhir
      message.error(apiErrorMessage(e));
    } finally {
      setModalJob(null);
      refetch();
    }
  };

  const columns = buildColumns((job) => setModalJob(job));
  const jobs = result?.jobs ?? [];
  const shift = result?.activeShift;

  const shiftLabel = shift
    ? `${shift.shiftName} (${dayjs(shift.start).format("HH:mm")} - ${dayjs(shift.end).format("HH:mm")})`
    : "";

  const renderContent = () => {
    if (notOnShift) {
      return (
        <Card>
          <Flex vertical align="center" gap="small" style={{ padding: 24, color: "#999" }}>
            <span>Anda tidak sedang on-shift.</span>
            <span style={{ fontSize: 12 }}>Take over hanya bisa dilakukan saat jam shift Anda.</span>
          </Flex>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <Flex vertical align="center" gap="middle" style={{ padding: 24 }}>
            <span style={{ color: "#ff4d4f" }}>{apiErrorMessage(error)}</span>
            <Button onClick={refetch}>Coba lagi</Button>
          </Flex>
        </Card>
      );
    }

    if (!loading && jobs.length === 0) {
      return (
        <Card title={shiftLabel ? `Belum Selesai - Shift Anda: ${shiftLabel}` : "Belum Selesai"}>
          <Flex justify="center" style={{ color: "#999" }}>
            Tidak ada job yang belum selesai.
          </Flex>
        </Card>
      );
    }

    return (
      <Card title={shiftLabel ? `Belum Selesai - Shift Anda: ${shiftLabel}` : "Belum Selesai"}>
        <Table<TakeOverJob>
          rowKey="id"
          columns={columns}
          dataSource={jobs}
          loading={loading}
          pagination={false}
        />
      </Card>
    );
  };

  return (
    <Flex vertical gap="large" style={{ padding: 24 }}>
      <span style={{ fontSize: 20, fontWeight: 600 }}>Take Over Job</span>

      {renderContent()}

      <TakeOverModal
        open={modalJob !== null}
        job={modalJob}
        onCancel={() => setModalJob(null)}
        onConfirm={handleConfirm}
      />
    </Flex>
  );
}
```

src/pages/take-over-job/data.ts
import type { TakeOverJob } from "models/take-over-job";

/**
 * Data contoh, bentuknya sama dengan hasil GET /api/my-job/pending
 * setelah toTakeOverJob(). Halaman memakai API, jadi ini hanya untuk mock atau test.
 */
export const mockPendingJobs: TakeOverJob[] = [
  {
    id: "t1a8s3d5f7asset001gdgb",
    title: "Pembaruan data asset",
    deadline: "2026-09-20T12:00:00+07:00",
    status: "IN_PROGRESS",
    slaStatus: "ON_TRACK",
    startedAt: "2026-09-20T08:15:00+07:00",
    previousOwner: { id: 1, name: "budi" },
    note: "Lantai 1-2 done, lantai 3 belum",
    noteAt: "2026-09-20T10:30:00+07:00",
    noteBy: { id: 1, name: "budi" },
  },
  {
    id: "t2q9w4e6r8ticket002gdga",
    title: "Rekapitulasi tiket",
    deadline: "2026-09-20T10:00:00+07:00",
    status: "IN_PROGRESS",
    slaStatus: "OVERDUE",
    startedAt: "2026-09-20T09:00:00+07:00",
    previousOwner: { id: 4, name: "citra" },
    note: "Tiket nomor 1-10 sudah direkap",
    noteAt: "2026-09-20T09:40:00+07:00",
    noteBy: { id: 4, name: "citra" },
  },
  {
    id: "t3z1x7c2v9backup003dc",
    title: "Pengecekan backup server",
    deadline: "2026-09-21T06:00:00+07:00",
    status: "NOT_STARTED",
    slaStatus: "ON_TRACK",
    startedAt: null,
    previousOwner: { id: 5, name: "dian" },
    note: null,
    noteAt: null,
    noteBy: null,
  },
];
```