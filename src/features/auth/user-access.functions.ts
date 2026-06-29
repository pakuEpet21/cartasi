/**
 * User Access Control — Server Functions
 * Provides global app roles and per-restaurant memberships.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole, MemberRole } from "@/features/restaurants/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserMembership = {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  role: MemberRole;
};

export type UserAccessData = {
  appRoles: AppRole[];
  memberships: UserMembership[];
};

// ---------------------------------------------------------------------------
// Server Function
// ---------------------------------------------------------------------------

/** GET — Returns the current user's global app roles and restaurant memberships */
export const getCurrentUserRolesAndMemberships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserAccessData> => {
    const { supabase, userId } = context;

    // Fetch global app roles from user_roles
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      throw new Error(rolesError.message);
    }

    const appRoles: AppRole[] = (rolesData ?? []).map((r) => r.role as AppRole);

    // Fetch restaurant memberships from restaurant_members joined with restaurants
    const { data: membersData, error: membersError } = await supabase
      .from("restaurant_members")
      .select("role, restaurant_id, restaurants(id, slug, name)")
      .eq("user_id", userId);

    if (membersError) {
      throw new Error(membersError.message);
    }

    const memberships: UserMembership[] = (membersData ?? []).map((m) => ({
      restaurantId: m.restaurant_id,
      restaurantSlug: (m.restaurants as unknown as { slug: string })?.slug ?? "",
      restaurantName: (m.restaurants as unknown as { name: string })?.name ?? "",
      role: m.role as MemberRole,
    }));

    return { appRoles, memberships };
  });
