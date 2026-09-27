import type { Core } from "@strapi/strapi";

export type ActionType =
  | "CREATED"
  | "ASSIGNED"
  | "STARTED"
  | "NOTE"
  | "TAKEOVER"
  | "DONE";

// ⚠️ Beda sama utils lain: fungsi ini NULIS ke database, makanya butuh `strapi`
export function logHistory(
  strapi: Core.Strapi,
  event: {
    job: string;
    actionType: ActionType;
    user?: string;
    previousUser?: string;
    description?: string;
  },
) {
  return strapi
    .documents("api::job-history.job-history")
    .create({ data: event });
}
