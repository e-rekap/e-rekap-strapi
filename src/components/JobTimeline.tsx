import { Empty, Timeline } from "antd";
import type { ActionType, JobHistory } from "models/jobHistory";
import { formatDateTimeWIB } from "utils/format";

// Warna diturunin dari actionType, sesuai mockup slide 15. Gak disimpan di DB
const COLOR: Record<ActionType, string> = {
  CREATED: "blue",
  ASSIGNED: "blue",
  STARTED: "orange",
  NOTE: "gray",
  TAKEOVER: "red",
  DONE: "green",
};

// Satu baris history → satu kalimat. Semua info diambil dari baris itu sendiri
function describe(h: JobHistory) {
  switch (h.actionType) {
    case "CREATED":
      return "Job dibuat oleh Admin";
    case "ASSIGNED":
      return h.previousUser
        ? `Ditugaskan ulang: ${h.previousUser.name} → ${h.user?.name}`
        : `Ditugaskan ke ${h.user?.name}`;
    case "STARTED":
      return `Dimulai oleh ${h.user?.name}`;
    case "NOTE":
      return `Catatan ${h.user?.name}: "${h.description}"`;
    case "TAKEOVER":
      return `Take Over: ${h.previousUser?.name} → ${h.user?.name}`;
    case "DONE":
      return `Selesai oleh ${h.user?.name}`;
  }
}

export default function JobTimeline({
  histories,
}: {
  histories: JobHistory[];
}) {
  if (histories.length === 0) return <Empty description="Belum ada riwayat" />;
  return (
    <Timeline
      items={histories.map((h) => ({
        color: COLOR[h.actionType],
        children: (
          <>
            <strong>{formatDateTimeWIB(h.createdAt)}</strong> — {describe(h)}
          </>
        ),
      }))}
    />
  );
}
