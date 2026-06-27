/**
 * Super Admin Restaurant Management — TypeScript types
 * PR 1: Database Foundation
 */

import type { Database } from "@/integrations/supabase/types"

// ---------------------------------------------------------------------------
// Database-derived types
// ---------------------------------------------------------------------------

export type AppRole = Database["public"]["Enums"]["app_role"]
export type MemberRole = Database["public"]["Enums"]["member_role"]

export type RestaurantInvitation = Database["public"]["Tables"]["restaurant_invitations"]["Row"]
export type RestaurantInvitationInsert = Database["public"]["Tables"]["restaurant_invitations"]["Insert"]
export type RestaurantInvitationUpdate = Database["public"]["Tables"]["restaurant_invitations"]["Update"]

export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"]
export type RestaurantInsert = Database["public"]["Tables"]["restaurants"]["Insert"]
export type RestaurantUpdate = Database["public"]["Tables"]["restaurants"]["Update"]

export type RestaurantMember = Database["public"]["Tables"]["restaurant_members"]["Row"]
export type RestaurantMemberInsert = Database["public"]["Tables"]["restaurant_members"]["Insert"]

// ---------------------------------------------------------------------------
// Super Admin DTOs
// ---------------------------------------------------------------------------

/** Member row enriched with email from auth.users (via get_restaurant_members_with_email) */
export interface SuperAdminMember {
  id: string
  user_id: string
  email: string
  role: MemberRole
  created_at: string
}

/** Full restaurant detail returned by getRestaurantDetails */
export interface SuperAdminRestaurantDetails {
  restaurant: Restaurant
  invitations: RestaurantInvitation[]
  members: SuperAdminMember[]
}

/** Paginated list response */
export interface PaginatedRestaurants {
  items: Restaurant[]
  total: number
  page: number
  pageSize: number
}

/** Form data for creating a restaurant */
export interface CreateRestaurantInput {
  name: string
  slug: string
}

/** Form data for inviting an owner */
export interface InviteOwnerInput {
  restaurantId: string
  email: string
}

/** Form data for inviting staff (admin or staff role) */
export interface InviteStaffInput {
  restaurantId: string
  email: string
  role: "admin" | "staff"
}

/** Result of creating an invitation */
export interface InvitationCreated {
  invitationId: string
  token: string
}

/** Result of toggling restaurant active status */
export interface ToggleStatusResult {
  success: boolean
}