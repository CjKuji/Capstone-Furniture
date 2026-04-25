import type { UserRole } from "@/types/enums";

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

/* =========================================================
   ROLE HELPERS (ADD THIS)
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