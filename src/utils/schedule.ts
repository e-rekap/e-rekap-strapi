// Kunci unik: 1 member cuma boleh 1 shift per tanggal
export const scheduleKey = (memberDocumentId: string, shiftDate: string) =>
  `${memberDocumentId}:${shiftDate}`;
