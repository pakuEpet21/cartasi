/**
 * User Access Control — useCurrentUserAccess hook
 * Provides role-based access control for the admin panel.
 */

import { useQuery } from "@tanstack/react-query";
import { getCurrentUserRolesAndMemberships, type UserMembership } from "./user-access.functions";
import type { AppRole } from "@/features/restaurants/types";
import {
  checkCanManageMenu,
  checkCanManageMembers,
  checkCanViewMenu,
  checkIsSuperAdmin,
} from "./access-helpers";

export type UseCurrentUserAccessResult = {
  appRoles: AppRole[];
  memberships: UserMembership[];
  isSuperAdmin: boolean;
  isLoading: boolean;
  isError: boolean;
  canManageMenu: (restaurantId: string) => boolean;
  canManageMembers: (restaurantId: string) => boolean;
  canViewMenu: (restaurantId: string) => boolean;
  canManageFlags: boolean;
  canManageRestaurant: (restaurantId: string) => boolean;
  canInviteToRestaurant: (restaurantId: string) => boolean;
};

/**
 * Returns the current user's roles and permissions.
 * - appRoles: global app roles from user_roles (e.g., super_admin)
 * - memberships: per-restaurant memberships from restaurant_members
 * - isSuperAdmin: true if user has super_admin global role
 * - canManageMenu(restaurantId): owner or admin of that restaurant
 * - canManageMembers(restaurantId): owner of that restaurant
 * - canViewMenu(restaurantId): owner, admin, or staff of that restaurant
 * - canManageFlags: super_admin only
 * - canManageRestaurant(restaurantId): owner or admin of that restaurant (alias for canManageMenu)
 * - canInviteToRestaurant(restaurantId): owner of that restaurant (same as canManageMembers)
 */
export function useCurrentUserAccess(): UseCurrentUserAccessResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth", "user-access"],
    queryFn: () => getCurrentUserRolesAndMemberships(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const appRoles: AppRole[] = data?.appRoles ?? [];
  const memberships: UserMembership[] = data?.memberships ?? [];
  const isSuperAdmin = checkIsSuperAdmin(appRoles);

  function canManageMenu(restaurantId: string): boolean {
    return checkCanManageMenu(appRoles, memberships, restaurantId);
  }

  function canManageMembers(restaurantId: string): boolean {
    return checkCanManageMembers(appRoles, memberships, restaurantId);
  }

  function canViewMenu(restaurantId: string): boolean {
    return checkCanViewMenu(appRoles, memberships, restaurantId);
  }

  const canManageFlags = isSuperAdmin;

  function canManageRestaurant(restaurantId: string): boolean {
    return canManageMenu(restaurantId);
  }

  function canInviteToRestaurant(restaurantId: string): boolean {
    return canManageMembers(restaurantId);
  }

  return {
    appRoles,
    memberships,
    isSuperAdmin,
    isLoading,
    isError,
    canManageMenu,
    canManageMembers,
    canViewMenu,
    canManageFlags,
    canManageRestaurant,
    canInviteToRestaurant,
  };
}
