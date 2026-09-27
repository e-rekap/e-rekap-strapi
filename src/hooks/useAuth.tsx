import { createContext, useContext, useState, type ReactNode } from "react";
import type { AppUser } from "models/user";
import { DEV_ADMIN } from "variables/devUsers";
import { setActorId } from "services/api";

type AuthValue = { user: AppUser; setUser: (u: AppUser) => void };
const AuthContext = createContext<AuthValue | null>(null);
const STORAGE_KEY = "erekap/devUser";

// Kasih tahu API client: request berikutnya atas nama siapa. Admin gak punya baris Member → null
const syncActor = (u: AppUser) => setActorId(u.role === "USER" ? u.id : null);

function loadUser(): AppUser {
  let user = DEV_ADMIN;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) user = JSON.parse(saved);
  } catch {}
  syncActor(user); // langsung, sebelum ada komponen yang sempat fetch
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser>(loadUser);

  const setUser = (u: AppUser) => {
    syncActor(u); // langsung juga, sebelum request baru jalan
    setUserState(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return value;
}