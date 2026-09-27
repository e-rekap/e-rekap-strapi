import { useState } from "react";
import { App } from "antd";
import { addNote, doneJob, startJob, takeOverJob } from "services/jobService";

export function useJobActions(onChanged: () => void) {
  const { message } = App.useApp();
  const [pendingId, setPendingId] = useState<string | null>(null); // job yang lagi diproses

  // Balikin true kalau berhasil, false kalau gagal
  const run = async (
    jobId: string,
    action: () => Promise<unknown>,
    successText: string,
  ) => {
    setPendingId(jobId);
    try {
      await action();
      message.success(successText);
      onChanged();
      return true;
    } catch (err) {
      message.error((err as Error).message); // misalnya "Ini bukan job kamu"
      return false;
    } finally {
      setPendingId(null);
    }
  };

  return {
    pendingId,
    start: (id: string) => run(id, () => startJob(id), "Job dimulai"),
    note: (id: string, content: string) =>
      run(id, () => addNote(id, content), "Catatan tersimpan"),
    done: (id: string, note: string) =>
      run(id, () => doneJob(id, note), "Job selesai 🎉"),
    takeOver: (id: string) =>
      run(id, () => takeOverJob(id), "Job berhasil diambil alih"),
  };
}
