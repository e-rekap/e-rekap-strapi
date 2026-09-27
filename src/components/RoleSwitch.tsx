import type { ReactNode } from "react";
import { useAuth } from "hooks/useAuth";

export default function RoleSwitch({
  admin,
  user,
}: {
  admin: ReactNode;
  user: ReactNode;
}) {
  const { user: me } = useAuth();
  return <>{me.role === "ADMIN" ? admin : user}</>;
}
