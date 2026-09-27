export default {
  routes: [
    // ⚠️ harus kebaca sebelum GET /shift-schedules/:id bawaan, alasannya sama kayak /jobs/mine
    {
      method: "GET",
      path: "/shift-schedules/mine",
      handler: "api::shift-schedule.shift-schedule.mine",
    },
  ],
};
