import { apiRequest } from "services/api";

export const MY_SHIFTS_PATH = "/shift-schedules/mine";

export function buildSchedulesKey(date: string | null) {
  const params = new URLSearchParams({ sort: "shiftDate:asc", populate: "*" }); 
  // populate biar member & shift ikut kebawa
  
  if (date) params.set("filters[shiftDate][$eq]", date);
  return `/shift-schedules?${params.toString()}`;
}

export function createSchedule(data: {
  shiftDate: string;
  member: string;
  shift: string;
}) {
  // Strapi minta body-nya dibungkus { data: ... }
  return apiRequest("/shift-schedules", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

export function deleteSchedule(documentId: string) {
  return apiRequest(`/shift-schedules/${documentId}`, { method: "DELETE" });
}
