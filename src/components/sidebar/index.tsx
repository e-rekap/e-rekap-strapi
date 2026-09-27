import { Menu } from "antd";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "hooks/useAuth";

const ADMIN_ITEMS = [
  { key: "/shift", label: "Shift Schedule" },
  { key: "/jobs", label: "Jobs" },
  { key: "/dashboard", label: "Dashboard" },
];
const USER_ITEMS = [
  { key: "/jobs", label: "Job Saya" },
  { key: "/pending", label: "Belum Selesai" },
  { key: "/shift", label: "Shift Saya" },
];

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <Menu
      mode="inline"
      selectedKeys={[pathname]}
      items={user.role === "ADMIN" ? ADMIN_ITEMS : USER_ITEMS}
      onClick={({ key }) => navigate(key)}
    />
  );
}
