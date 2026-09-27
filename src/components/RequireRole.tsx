import { Navigate, Outlet } from "react-router";
import { useAuth } from "hooks/useAuth";
import type { Role } from "models/user";

export default function RequireRole({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth();
  if (!allowed.includes(user.role)) return <Navigate to="/jobs" replace />;
  return <Outlet />; // boleh masuk → tampilin halaman anak-anaknya
}
