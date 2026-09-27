import type { Member } from "models/shiftSchedule";
export type JobStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";
export type SlaLabel = "ON_TIME" | "OVERDUE" | "LEWAT_DEADLINE" | null;
export type JobAction = "START" | "NOTE" | "DONE";

export interface Job {
  id: number;
  documentId: string;
  title: string;
  desc: string;
  jobDate: string; // 'YYYY-MM-DD'
  deadline: string; // ISO dalam UTC
  notes: string | null;
  jobStatus: JobStatus;
  startedAt: string | null;
  completedAt: string | null;
  slaLabel: SlaLabel; // tambahan dari controller kamu
  assignee: Member | null;
  assignedAt: string | null;
  canEdit: boolean;
  actions?: JobAction[]; // cuma ada di response /jobs/mine
  lastNote?: string | null; // cuma ada di response /jobs/pending
}

// satu data
export interface StrapiItem<T> {
  data: T;
  meta: object;
}

// list data
export interface StrapiList<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface JobFilters {
  status: JobStatus | null;
  date: string | null; // 'YYYY-MM-DD'
}
