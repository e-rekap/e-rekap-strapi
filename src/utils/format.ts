// Timestamp ISO (UTC) → '20 Sep 2026, 12.00' dalam WIB
export function formatDateTimeWIB(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

// 'YYYY-MM-DD' → '20 Sep 2026'. Pakai UTC biar tanggalnya gak geser
export function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

// ISO (UTC) → '12:00' dalam jam WIB. Dipakai buat ngisi TimePicker waktu edit
export function timeWIB(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso));
}

// '2026-09-20' + '12:00' → '2026-09-20T12:00:00+07:00'
export function buildDeadline(date: string, time: string) {
  return `${date}T${time}:00+07:00`;
}