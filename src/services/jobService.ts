import type { JobFilters } from "models/job";
import { apiRequest } from "services/api";

export function buildJobsKey(filters: JobFilters) {
  const params = new URLSearchParams({
    sort: "deadline:asc",
    populate: "assignee",
  });

  // TODO 1: kalau filters.status ada → params.set('filters[jobStatus][$eq]', filters.status)

  if (filters.status != null) {
    params.set("filters[jobStatus][$eq]", filters.status); // eq = equal
  }

  // TODO 2: kalau filters.date ada   → params.set('filters[jobDate][$eq]', filters.date)
  if (filters.date != null) {
    params.set("filters[jobDate][$eq]", filters.date);
  }

  return `/jobs?${params.toString()}`;
}

export type JobInput = {
  title: string;
  desc: string;
  jobDate: string;
  deadline: string;
  notes: string | null;
};

export const createJob = (data: JobInput) =>
  apiRequest("/jobs", { method: "POST", body: JSON.stringify({ data }) });

export const updateJob = (documentId: string, data: JobInput) =>
  apiRequest(`/jobs/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });

export const deleteJob = (documentId: string) =>
  apiRequest(`/jobs/${documentId}`, { method: "DELETE" });

export const candidatesKey = (documentId: string) =>
  `/jobs/${documentId}/candidates`;

// Endpoint buatan kita sendiri, jadi bentuk body-nya kita yang nentuin: { memberId }, gak pakai { data }
export const assignJob = (documentId: string, memberId: string) =>
  apiRequest(`/jobs/${documentId}/assign`, {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });

export const jobDetailKey = (documentId: string) =>
  `/jobs/${documentId}?populate=assignee`;

export function jobHistoryKey(documentId: string) {
  const params = new URLSearchParams({
    "filters[job][documentId][$eq]": documentId, // filter lewat relasi: riwayat punya job ini aja
    sort: "createdAt:asc", // urut dari yang paling lama
    populate: "*", // biar user & previousUser ikut kebawa
  });
  return `/job-histories?${params.toString()}`;
}

export const MY_JOBS_PATH = "/jobs/mine";

export const startJob = (id: string) =>
  apiRequest(`/jobs/${id}/start`, { method: "POST" });

export const addNote = (id: string, content: string) =>
  apiRequest(`/jobs/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const doneJob = (id: string, note: string) =>
  apiRequest(`/jobs/${id}/done`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });

export const PENDING_PATH = "/jobs/pending";

export const takeOverJob = (id: string) =>
  apiRequest(`/jobs/${id}/takeover`, { method: "POST" });

// before swr
// export const JOBS_KEY = "/jobs?sort=deadline:asc";
// export function getJobs(signal?: AbortSignal) {
//   return apiRequest<StrapiList<Job>>("/jobs?sort=deadline:asc", { signal });
// }
