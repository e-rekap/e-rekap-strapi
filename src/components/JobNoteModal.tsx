import { useState } from "react";
import { Button, Input, Modal, Popconfirm } from "antd";
import { useRecoilState, useResetRecoilState } from "recoil";
import type { Job } from "models/job";
import { noteDraftFamily } from "atoms/noteDraft";

export type NoteMode = "note" | "done";
type Props = {
  job: Job | null; // null = modal tertutup
  mode: NoteMode;
  onClose: () => void;
  onSubmit: (text: string) => Promise<boolean>; // true = berhasil
};

export default function JobNoteModal({ job, mode, onClose, onSubmit }: Props) {
  const draftAtom = noteDraftFamily(job?.documentId ?? ""); // ambil loker punya job ini
  const [draft, setDraft] = useRecoilState(draftAtom);
  const resetDraft = useResetRecoilState(draftAtom);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const ok = await onSubmit(draft.trim());
    setSaving(false);
    if (ok) resetDraft(); // draft cuma dikosongin kalau BERHASIL
  };

  const isDone = mode === "done";
  return (
    <Modal
      title={isDone ? `Selesaikan: ${job?.title}` : `Catatan: ${job?.title}`}
      open={!!job}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Batal
        </Button>,
        isDone ? (
          <Popconfirm
            key="ok"
            title="Tandai sebagai selesai?"
            okText="Ya"
            cancelText="Batal"
            onConfirm={submit}
          >
            <Button type="primary" loading={saving}>
              Done
            </Button>
          </Popconfirm>
        ) : (
          <Button
            key="ok"
            type="primary"
            loading={saving}
            disabled={!draft.trim()}
            onClick={submit}
          >
            Simpan
          </Button>
        ),
      ]}
    >
      <Input.TextArea
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={
          isDone ? "Catatan terakhir (opsional)" : "Tulis progres kamu..."
        }
      />
    </Modal>
  );
}
