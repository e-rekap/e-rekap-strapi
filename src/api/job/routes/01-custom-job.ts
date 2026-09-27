export default {
  routes: [
    {
      method: "GET",
      path: "/jobs/:id/candidates",
      handler: "api::job.job.candidates",
    },
    {
      method: "POST",
      path: "/jobs/:id/assign",
      handler: "api::job.job.assign",
    },
    { method: "GET", path: "/jobs/mine", handler: "api::job.job.mine" },
    { method: "POST", path: "/jobs/:id/start", handler: "api::job.job.start" },
    { method: "POST", path: "/jobs/:id/notes", handler: "api::job.job.notes" },
    { method: "POST", path: "/jobs/:id/done", handler: "api::job.job.done" },
    { method: "GET", path: "/jobs/pending", handler: "api::job.job.pending" },
    {
      method: "POST",
      path: "/jobs/:id/takeover",
      handler: "api::job.job.takeover",
    },
  ],
};
