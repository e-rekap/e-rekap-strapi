import { useState } from "react";
import { App, DatePicker, Form, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";
import useSWR from "swr";
import type { StrapiList } from "models/job";
import type { Member, Shift } from "models/shiftSchedule";
import { MEMBERS_KEY } from "services/memberService";
import { SHIFTS_KEY } from "services/shiftService";
import { createSchedule } from "services/shiftScheduleService";

type FormValues = { shiftDate: Dayjs; member: string; shift: string };
type Props = { open: boolean; onClose: () => void; onCreated: () => void };

export default function AddScheduleModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const { data: members } = useSWR<StrapiList<Member>>(MEMBERS_KEY);
  const { data: shifts } = useSWR<StrapiList<Shift>>(SHIFTS_KEY);

  const handleOk = async () => {
    const values = await form.validateFields().catch(() => null); // 1. cek field wajib (validasi FE)
    if (!values) return;

    setSaving(true);
    try {
      await createSchedule({
        // 2. kirim ke BE
        shiftDate: values.shiftDate.format("YYYY-MM-DD"),
        member: values.member,
        shift: values.shift,
      });
      message.success("Jadwal tersimpan");
      form.resetFields();
      onCreated();
    } catch (err) {
      message.error((err as Error).message); // 3. pesan dari BE, misalnya "Budi sudah punya shift..."
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Tambah Shift"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={saving}
      okText="Simpan"
      cancelText="Batal"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="shiftDate"
          label="Tanggal"
          rules={[{ required: true, message: "Tanggal wajib diisi" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="member"
          label="User"
          rules={[{ required: true, message: "User wajib dipilih" }]}
        >
          <Select
            placeholder="Pilih user"
            options={members?.data.map((m) => ({
              value: m.documentId,
              label: m.name,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="shift"
          label="Shift"
          rules={[{ required: true, message: "Shift wajib dipilih" }]}
        >
          <Select
            placeholder="Pilih shift"
            options={shifts?.data.map((s) => ({
              value: s.documentId,
              label: s.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
