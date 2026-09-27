import type { AppUser } from "models/user";

// Admin gak ada di tabel Member (identitasnya nanti dari OneWeb), jadi ditulis manual di sini
export const DEV_ADMIN: AppUser = { id: 'admin', name: 'Rina', role: 'ADMIN' };

// export const DEV_USERS: AppUser[] = [
//   { id: "rina", name: "Rina", role: "ADMIN" },
//   { id: "budi", name: "Budi", role: "USER" },
//   { id: "andi", name: "Andi", role: "USER" },
//   { id: "sari", name: "Sari", role: "USER" },
// ];
