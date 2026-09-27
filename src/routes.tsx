import { Navigate, type RouteObject } from "react-router";
import ErekapRoot from "components/layout/ERekapRoot";
import JobListPage from "./pages/JobListPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import RequireRole from "./components/RequireRole";
import RoleSwitch from "./components/RoleSwitch";
import { withRole } from "./hocs/withRole";
import ShiftSchedulePage from "./components/ShiftSchedulePage";
import JobDetailPage from "./pages/JobDetailPage";
import MyJobsPage from "./pages/MyJobsPage";
import PendingPage from "./pages/PendingPage";
import MyShiftPage from "./pages/MyShiftPage";

const AdminDashboard = withRole(["ADMIN"])(PlaceholderPage);

const router: RouteObject[] = [
  {
    element: <ErekapRoot />, // route tanpa path = "pembungkus"
    children: [
      { index: true, element: <Navigate to="jobs" replace /> },
      {
        path: "jobs",
        element: <RoleSwitch admin={<JobListPage />} user={<MyJobsPage />} />,
      },
      { path: "jobs/:id", element: <JobDetailPage /> },
      {
        path: "shift",
        element: (
          <RoleSwitch admin={<ShiftSchedulePage />} user={<MyShiftPage />} />
        ),
      },
      { path: "dashboard", element: <AdminDashboard title="Dashboard" /> }, // cara 1: HOC
      {
        element: <RequireRole allowed={["USER"]} />,
        children: [{ path: "pending", element: <PendingPage /> }],
      },
    ],
  },
];

export default router;
