export interface Member {
  id: number;
  documentId: string;
  name: string;
}

export interface Shift {
  id: number;
  documentId: string;
  name: string;
  startTime: string; // 'HH:mm:ss.SSS'
  endTime: string;
  order: number;
  crossesMidnight: boolean;
}

export interface ShiftSchedule {
  id: number;
  documentId: string;
  shiftDate: string; // 'YYYY-MM-DD'
  member: Member | null; // ada isinya kalau di-populate
  shift: Shift | null;
}

export type DutyStatus = "DONE" | "ON_DUTY" | "UPCOMING";

export interface MyShift {
  documentId: string;
  shiftDate: string;
  shift: Shift | null;
  dutyStatus: DutyStatus | null; // dihitung BE pakai jam server
  isToday: boolean; // dihitung BE juga
}