import type { UserRole } from "@/types/enums";

export type Profile = {
  id: string;

  full_name: string | null;

  role: UserRole;

  created_at: string;
};