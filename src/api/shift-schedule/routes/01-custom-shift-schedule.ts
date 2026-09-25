export default {
  routes: [
    {
      method: "GET",
      path: "/my-shift",
      handler: "shift-schedule.myShifts", // <nama controller>.<nama fungsi>
    },
  ],
};
