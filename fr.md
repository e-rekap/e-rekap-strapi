src/services/my-job.ts
```
import { api } from "services/api"; // sesuaikan path instance axios bersama
import { toMyJob, type MyJobGroup, type MyJobResponse } from "models/my-job";

export const getMyJobs = async (date: string): Promise<MyJobGroup> => {
  const res = await api.get<{ data: MyJobResponse[]; meta: { date: string } }>("/my-job", {
    params: { date },
  });
  return { date: res.data.meta.date, jobs: res.data.data.map(toMyJob) };
};

export const startJob = (id: string) => api.post(`/my-job/${id}/start`);
export const addJobNote = (id: string, note: string) => api.post(`/my-job/${id}/notes`, { note });
export const completeJob = (id: string) => api.post(`/my-job/${id}/complete`);

/** Ambil pesan error dari format Strapi: { error: { status, message } } */
export const apiErrorMessage = (e: any) =>
  e?.response?.data?.error?.message ?? "Terjadi kesalahan, coba lagi";
```
src/hooks/useMyJobs.ts
```
import { useCallback, useEffect, useState } from "react";
import type { MyJobGroup } from "models/my-job";
import { getMyJobs } from "services/my-job";

export function useMyJobs(date: string) {
  const [group, setGroup] = useState<MyJobGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroup(await getMyJobs(date));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { group, loading, error, refetch };
}
```

```
export default function MyJobsPage() {
  const [date] = useState(dayjs().format("YYYY-MM-DD")); // bisa dihubungkan ke DatePicker
  const { group, loading, refetch } = useMyJobs(date);
  const [modalJob, setModalJob] = useState<MyJob | null>(null);

  const handleConfirm = async (job: MyJob, note: string) => {
    try {
      if (job.status === "NOT_STARTED") {
        await startJob(job.id);
        if (note) await addJobNote(job.id, note);
      } else {
        if (note) await addJobNote(job.id, note);
        await completeJob(job.id);
      }
      message.success(`Job "${job.title}" berhasil diperbarui`);
      setModalJob(null);
    } catch (e) {
      message.error(apiErrorMessage(e)); // 409 = status sudah berubah, data akan di-refresh
    } finally {
      refetch();
    }
  };

  // ...
  <Card title={`Job Saya - (${dayjs(date).format("DD MMM")})`}>
    <Table<MyJob> rowKey="id" columns={columns} dataSource={group?.jobs ?? []} loading={loading} pagination={false} />
  </Card>
}
```

src/pages/my-jobs/index.tsx
```
import { useState } from "react";
import dayjs from "dayjs";
import { Button, Card, Flex, Table, Tag, message } from "one-web-components-react";
import type { TableProps } from "one-web-components-react";
import JobStatusModal from "./job-status-modal";
import type { JobStatus, MyJob, SlaStatus } from "models/my-job";
import { useMyJobs } from "hooks/useMyJobs";
import { addJobNote, apiErrorMessage, completeJob, startJob } from "services/my-job";

// ── Status Tag ────────────────────────────────────────────
const STATUS_TAG_COLOR: Record<JobStatus, string> = {
  NOT_STARTED: "default",
  IN_PROGRESS: "processing",
  DONE: "success",
};
const STATUS_LABEL: Record<JobStatus, string> = {
  NOT_STARTED: "NOT START",
  IN_PROGRESS: "IN PROG",
  DONE: "DONE",
};

// ── SLA Tag (nilai dari backend) ──────────────────────────
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

// ── Columns builder ───────────────────────────────────────
function buildColumns(onOpenModal: (job: MyJob) => void): TableProps<MyJob>["columns"] {
  return [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      key: "deadline",
      width: 110,
      render: (deadline: string, record: MyJob) => (
        <span style={{ color: record.slaStatus === "OVERDUE" ? "#ff4d4f" : "#333" }}>
          {dayjs(deadline).format("HH:mm")}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: JobStatus) => (
        <Tag color={STATUS_TAG_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 170,
      render: (_: unknown, record: MyJob) => {
        // Tombol mengikuti `actions` dari backend
        if (record.actions.includes("start")) {
          return (
            <Button type="primary" size="small" onClick={() => onOpenModal(record)}>
              Start
            </Button>
          );
        }
        if (record.actions.includes("complete")) {
          return (
            <Button type="primary" size="small" onClick={() => onOpenModal(record)}>
              Done
            </Button>
          );
        }
        // DONE → tampilkan SLA final (On Time / Overdue)
        return record.slaStatus ? (
          <Tag color={SLA_TAG_COLOR[record.slaStatus]}>{SLA_LABEL[record.slaStatus]}</Tag>
        ) : (
          <span style={{ color: "#bbb" }}>-</span>
        );
      },
    },
  ];
}

// ── Page ──────────────────────────────────────────────────
export default function MyJobsPage() {
  const [date] = useState(() => dayjs().format("YYYY-MM-DD"));
  const { group, loading, error, refetch } = useMyJobs(date);
  const [modalJob, setModalJob] = useState<MyJob | null>(null);

  const handleConfirm = async (job: MyJob, note: string) => {
    try {
      if (job.status === "NOT_STARTED") {
        await startJob(job.id);
        if (note) await addJobNote(job.id, note);
        message.success(`Job "${job.title}" berhasil di-mark In Progress`);
      } else {
        if (note) await addJobNote(job.id, note);
        await completeJob(job.id);
        message.success(`Job "${job.title}" berhasil di-mark Done`);
      }
      setModalJob(null);
    } catch (e) {
      // 409 = status sudah berubah (misal di tab lain), 403 = job sudah diambil alih
      message.error(apiErrorMessage(e));
      setModalJob(null);
    } finally {
      refetch();
    }
  };

  const columns = buildColumns((job) => setModalJob(job));

  return (
    <Flex vertical gap="large" style={{ padding: 24 }}>
      <span style={{ fontSize: 20, fontWeight: 600 }}>My Job List</span>

      <Card title={`Job Saya - (${dayjs(date).format("DD MMM")})`}>
        {error && !group ? (
          <Flex vertical align="center" gap="middle" style={{ padding: 24 }}>
            <span style={{ color: "#ff4d4f" }}>{apiErrorMessage(error)}</span>
            <Button onClick={refetch}>Coba lagi</Button>
          </Flex>
        ) : (
          <Table<MyJob>
            rowKey="id"
            columns={columns}
            dataSource={group?.jobs ?? []}
            loading={loading}
            pagination={false}
          />
        )}
      </Card>

      <JobStatusModal
        open={modalJob !== null}
        job={modalJob}
        onCancel={() => setModalJob(null)}
        onConfirm={handleConfirm}
      />
    </Flex>
  );
}
```

src/pages/my-jobs/job-status-modal.tsx
```
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
} from "one-web-components-react";
import type { JobStatus, MyJob } from "models/my-job";

const { TextArea } = Input;

const NOTE_MAX_LENGTH = 1000;

const STEPS = ["Not Started", "In Progress", "Done"] as const;
const STEP_INDEX: Record<JobStatus, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  DONE: 2,
};

interface Props {
  open: boolean;
  job: MyJob | null;
  onCancel: () => void;
  /** Halaman yang memanggil API. Modal hanya mengirim job dan catatan. */
  onConfirm: (job: MyJob, note: string) => Promise<void>;
}

export default function JobStatusModal({ open, job, onCancel, onConfirm }: Props) {
  const [form] = Form.useForm<{ note?: string }>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, job?.id, form]);

  if (!job) return null;

  // Alur sequential: NOT_STARTED -> IN_PROGRESS -> DONE (tidak bisa dilewati)
  const nextStatus: JobStatus = job.status === "NOT_STARTED" ? "IN_PROGRESS" : "DONE";
  const isDone = nextStatus === "DONE";
  const currentIdx = STEP_INDEX[nextStatus];

  const handleCancel = () => {
    if (submitting) return;
    form.resetFields();
    onCancel();
  };

  const handleSubmit = async () => {
    let values: { note?: string };
    try {
      values = await form.validateFields();
    } catch {
      return; // validasi form gagal, pesan sudah tampil di field
    }

    setSubmitting(true);
    try {
      await onConfirm(job, values.note?.trim() ?? "");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Job: ${job.title}`}
      open={open}
      onCancel={handleCancel}
      width={520}
      maskClosable={!submitting}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>,
        // Start → langsung confirm
        !isDone && (
          <Button key="confirm" type="primary" loading={submitting} onClick={handleSubmit}>
            Confirm: Start
          </Button>
        ),
        // Done → butuh konfirmasi Popconfirm
        isDone && (
          <Popconfirm
            key="confirm"
            title="Tandai sebagai selesai?"
            description="Waktu selesai akan dicatat otomatis."
            okText="Ya"
            cancelText="Batal"
            onConfirm={handleSubmit}
          >
            <Button type="primary" loading={submitting}>
              Confirm: Done
            </Button>
          </Popconfirm>
        ),
      ]}
    >
      <Flex vertical gap="large">
        {/* Stepper: Not Started -> In Progress -> Done */}
        <Flex align="center">
          {STEPS.map((label, i) => (
            <span key={label} style={{ display: "inline-flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <Flex align="center" gap={6}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    background: i <= currentIdx ? "#1677ff" : "#f0f0f0",
                    color: i <= currentIdx ? "#fff" : "#999",
                    flexShrink: 0,
                  }}
                >
                  {i < currentIdx ? "✓" : i + 1}
                </span>
                <span
                  style={{
                    color: i === currentIdx ? "#1677ff" : "#666",
                    fontWeight: i === currentIdx ? 600 : 400,
                    fontSize: 13,
                  }}
                >
                  {label}
                </span>
              </Flex>
              {i < STEPS.length - 1 && (
                <span
                  style={{
                    flex: 1,
                    height: 2,
                    margin: "0 8px",
                    background: i < currentIdx ? "#1677ff" : "#f0f0f0",
                  }}
                />
              )}
            </span>
          ))}
        </Flex>

        {/* Info waktu */}
        <Flex vertical gap={4} style={{ fontSize: 13 }}>
          <div>
            <span style={{ color: "#666" }}>Deadline: </span>
            <span style={{ fontWeight: 500, color: job.slaStatus === "OVERDUE" ? "#ff4d4f" : undefined }}>
              {dayjs(job.deadline).format("DD MMM HH:mm")}
            </span>
          </div>
          {job.startedAt && (
            <div>
              <span style={{ color: "#666" }}>Mulai: </span>
              <span>{dayjs(job.startedAt).format("DD MMM HH:mm")}</span>
            </div>
          )}
          <div style={{ color: "#999", fontSize: 12 }}>
            {isDone
              ? "Waktu selesai akan dicatat otomatis saat Anda konfirmasi."
              : "Waktu mulai akan dicatat otomatis saat Anda konfirmasi."}
          </div>
        </Flex>

        <Form form={form} layout="vertical" disabled={submitting}>
          <Form.Item
            name="note"
            label="Catatan Progres (opsional)"
            rules={[{ max: NOTE_MAX_LENGTH, message: `Catatan maksimal ${NOTE_MAX_LENGTH} karakter` }]}
          >
            <TextArea
              rows={3}
              maxLength={NOTE_MAX_LENGTH}
              showCount
              placeholder="Lantai 1-2 sudah diinput"
            />
          </Form.Item>
        </Form>
      </Flex>
    </Modal>
  );
}

```