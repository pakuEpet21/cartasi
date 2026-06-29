/**
 * Pure access-control helpers.
 * These are easy to unit-test because they have no React or Supabase dependencies.
 */

import type { UserMembership } from "./user-access.functions";
import type { AppRole } from "@/features/restaurants/types";

export function checkIsSuperAdmin(appRoles: AppRole[]): boolean {
  return appRoles.includes("super_admin");
}

export function checkCanManageMenu(
  appRoles: AppRole[],
  memberships: UserMembership[],
  restaurantId: string,
): boolean {
  if (checkIsSuperAdmin(appRoles)) return true;
  const membership = memberships.find((m) => m.restaurantId === restaurantId);
  return membership?.role === "owner" || membership?.role === "admin";
}

export function checkCanManageMembers(
  appRoles: AppRole[],
  memberships: UserMembership[],
  restaurantId: string,
): boolean {
  if (checkIsSuperAdmin(appRoles)) return true;
  const membership = memberships.find((m) => m.restaurantId === restaurantId);
  return membership?.role === "owner";
}

export function checkCanViewMenu(
  appRoles: AppRole[],
  memberships: UserMembership[],
  restaurantId: string,
): boolean {
  if (checkIsSuperAdmin(appRoles)) return true;
  const membership = memberships.find((m) => m.restaurantId === restaurantId);
  return !!membership;
}
