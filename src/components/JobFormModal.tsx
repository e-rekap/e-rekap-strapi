import { useEffect, useState } from "react";
import { App, DatePicker, Form, Input, Modal, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { Job } from "models/job";
import { createJob, updateJob } from "services/jobService";
import { buildDeadline, timeWIB } from "utils/format";

type FormValues = {
  title: string;
  desc: string;
  jobDate: Dayjs;
  deadline: Dayjs;
  notes?: string;
};
type Props = {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function JobFormModal({ open, job, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  // Tiap kali modal dibuka: isi form (mode edit) atau kosongin (mode tambah)
  useEffect(() => {
    if (!open) return;
    if (job) {
      const [h, m] = timeWIB(job.deadline).split(":").map(Number);
      form.setFieldsValue({
        title: job.title,
        desc: job.desc,
        jobDate: dayjs(job.jobDate),
        deadline: dayjs().hour(h).minute(m).second(0),
        notes: job.notes ?? undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, job, form]);

  const handleOk = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const date = values.jobDate.format("YYYY-MM-DD");
    const data = {
      title: values.title.trim(),
      desc: values.desc.trim(),
      jobDate: date,
      deadline: buildDeadline(date, values.deadline.format("HH:mm")),
      notes: values.notes?.trim() || null,
    };

    setSaving(true);
    try {
      if (job) await updateJob(job.documentId, data);
      else await createJob(data);
      message.success(job ? "Job diperbarui" : "Job dibuat");
      onSaved();
    } catch (err) {
      message.error((err as Error).message); // misalnya "Job hanya bisa diedit saat Not Started"
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={job ? "Edit Job" : "Job Baru"}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={saving}
      okText="Simpan"
      cancelText="Batal"
      forceRender
    >
      <Form form={form} layout="vertical" initialValues={{ jobDate: dayjs() }}>
        <Form.Item
          name="title"
          label="Judul"
          rules={[
            { required: true, whitespace: true, message: "Judul wajib diisi" },
          ]}
        >
          <Input maxLength={100} showCount />
        </Form.Item>
        <Form.Item
          name="desc"
          label="Deskripsi"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Deskripsi wajib diisi",
            },
          ]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="jobDate"
          label="Tanggal"
          rules={[{ required: true, message: "Tanggal wajib diisi" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="deadline"
          label="Deadline (WIB)"
          rules={[{ required: true, message: "Deadline wajib diisi" }]}
        >
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="notes" label="Catatan">
          <Input placeholder="Opsional" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
