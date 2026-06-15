import type { UserRole } from "@/types/enums";

export type Profile = {
  id: string;
  first_name: string | null;
  middle_initial: string | null;
  last_name: string | null;
  role: UserRole;
  created_at: string;
};

/* =========================================================
   ROLE HELPERS
========================================================= */

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 1,
  admin: 2,
  super_admin: 3,
};

export function hasRole(
  userRole: UserRole,
  requiredRole: UserRole
) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}