import type { Member } from "models/shiftSchedule";

export type ActionType =
  | "CREATED"
  | "ASSIGNED"
  | "STARTED"
  | "NOTE"
  | "TAKEOVER"
  | "DONE";

export interface JobHistory {
  id: number;
  documentId: string;
  actionType: ActionType;
  user: Member | null; // pemegang SETELAH event
  previousUser: Member | null; // pemegang SEBELUM event
  description: string | null;
  createdAt: string; // waktu kejadian, bawaan Strapi
}
