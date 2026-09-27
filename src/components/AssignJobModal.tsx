import { useState } from "react";
import { App, Button, Empty, Modal, Popconfirm, Select } from "antd";
import useSWR from "swr";
import type { Job } from "models/job";
import type { Member, Shift } from "models/shiftSchedule";
import { assignJob, candidatesKey } from "services/jobService";

type Candidate = { member: Member; shift: Shift | null };
type Props = { job: Job | null; onClose: () => void; onAssigned: () => void }; // job null = modal tertutup

export default function AssignJobModal({ job, onClose, onAssigned }: Props) {
  const [memberId, setMemberId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  // key = null → SWR gak fetch apa-apa (modal lagi tertutup)
  const { data } = useSWR<{ data: Candidate[] }>(
    job ? candidatesKey(job.documentId) : null,
  );
  const candidates = data?.data ?? [];
  const chosen = candidates.find((c) => c.member.documentId === memberId);

  const close = () => {
    setMemberId(undefined);
    onClose();
  };

  const handleAssign = async () => {
    if (!job || !memberId) return;
    setSaving(true);
    try {
      await assignJob(job.documentId, memberId);
      message.success(`Job dikirim ke ${chosen?.member.name}`);
      setMemberId(undefined);
      onAssigned();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Assign Job: ${job?.title ?? ""}`}
      open={!!job}
      onCancel={close}
      footer={[
        <Button key="cancel" onClick={close}>
          Batal
        </Button>,
        <Popconfirm
          key="ok"
          title={`Kirim job ke ${chosen?.member.name}?`}
          okText="Kirim"
          cancelText="Batal"
          onConfirm={handleAssign}
          disabled={!memberId}
        >
          <Button type="primary" disabled={!memberId} loading={saving}>
            Assign to User
          </Button>
        </Popconfirm>,
      ]}
    >
      {data && candidates.length === 0 ? (
        <Empty description="Belum ada user terjadwal di tanggal ini" />
      ) : (
        <Select
          style={{ width: "100%" }}
          placeholder="Pilih user"
          loading={!data}
          value={memberId}
          onChange={setMemberId}
          options={candidates.map((c) => ({
            value: c.member.documentId,
            label: `${c.member.name} (${c.shift?.name ?? "-"})`,
          }))}
        />
      )}
    </Modal>
  );
}
