import type { ComponentType } from "react";
import { Navigate } from "react-router";
import { useAuth } from "hooks/useAuth";
import type { Role } from "models/user";

export function withRole(allowed: Role[]) {
  return function <P extends object>(Wrapped: ComponentType<P>) {
    function WithRole(props: P) {
      // TODO 1: ambil user dari useAuth()
      // const user = useAuth().user;
      const { user } = useAuth(); // => ngambil var user-nya useAuth (destructuring)

      // TODO 2: kalau user.role gak ada di `allowed` → return <Navigate to="/jobs" replace />
      if (!allowed.includes(user.role)) {
        return <Navigate to="/jobs" replace />;
      }

      // TODO 3: kalau boleh → render <Wrapped {...props} />
      return <Wrapped {...props} />;
    }

    WithRole.displayName = `withRole(${Wrapped.displayName || Wrapped.name || "Component"})`;
    return WithRole;
  };
}
