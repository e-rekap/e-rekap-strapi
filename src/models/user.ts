export type Role = "ADMIN" | "USER";

export interface AppUser {
  id: string;
  name: string;
  role: Role;
}
