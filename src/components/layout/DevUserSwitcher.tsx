import { Select } from "antd";
import useSWR from "swr";
import { useAuth } from "hooks/useAuth";
import type { AppUser } from "models/user";
import type { StrapiList } from "models/job";
import type { Member } from "models/shiftSchedule";
import { MEMBERS_KEY } from "services/memberService";
import { DEV_ADMIN } from "variables/devUsers";

export default function DevUserSwitcher() {
  const { user, setUser } = useAuth();
  const { data } = useSWR<StrapiList<Member>>(MEMBERS_KEY);

  // Admin (manual) + semua Member dari database
  const users: AppUser[] = [
    DEV_ADMIN,
    ...(data?.data ?? []).map((m) => ({
      id: m.documentId,
      name: m.name,
      role: "USER" as const,
    })),
  ];

  return (
    <Select
      value={user.id}
      loading={!data}
      style={{ width: 200 }}
      options={users.map((u) => ({
        value: u.id,
        label: `${u.name} (${u.role})`,
      }))}
      onChange={(id) => {
        const u = users.find((x) => x.id === id);
        if (u) setUser(u);
      }}
    />
  );
}

// import { Select } from "antd";
// import { useAuth } from "hooks/useAuth";
// import { DEV_USERS } from "variables/devUsers";

// export default function DevUserSwitcher() {
//   const { user, setUser } = useAuth();
//   return (
//     <Select
//       value={user.id}
//       style={{ width: 200 }}
//       options={DEV_USERS.map((u) => ({
//         value: u.id,
//         label: `${u.name} (${u.role})`,
//       }))}
//       onChange={(id) => setUser(DEV_USERS.find((u) => u.id === id)!)}
//     />
//   );
// }
