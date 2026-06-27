/**
 * Super Admin Restaurant Management — Server Functions
 * PR 2: Server Functions + Hook
 */

import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  InvitationCreated,
  PaginatedRestaurants,
  RestaurantInvitation,
  SuperAdminMember,
  SuperAdminRestaurantDetails,
  ToggleStatusResult,
} from "./types";

// ---------------------------------------------------------------------------
// Middleware: requireSuperAdmin
// ---------------------------------------------------------------------------

/**
 * Middleware that gates access to super_admin users.
 * Must be chained AFTER requireSupabaseAuth so context.supabase and
 * context.userId are available.
 */
const requireSuperAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (error || !data) {
      throw new Error("Forbidden: super admin required");
    }
    return next();
  });

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const CreateRestaurantSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
});

const ListRestaurantsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const GetRestaurantDetailsSchema = z.object({
  restaurantId: z.string().uuid(),
});

const AssignOwnerSchema = z.object({
  restaurantId: z.string().uuid(),
  email: z.string().email().toLowerCase().trim(),
});

const AssignStaffSchema = z.object({
  restaurantId: z.string().uuid(),
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(["admin", "staff"]),
});

const ToggleStatusSchema = z.object({
  restaurantId: z.string().uuid(),
  isActive: z.boolean(),
});

const ListInvitationsSchema = z.object({
  restaurantId: z.string().uuid(),
});

const GetInvitationByTokenSchema = z.object({
  token: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Helper: lazy-import supabaseAdmin (server-only, bypasses RLS)
// ---------------------------------------------------------------------------

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/** POST — Create a new restaurant with unique slug */
export const createRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((i) => CreateRestaurantSchema.parse(i))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const supabaseAdmin = await getSupabaseAdmin();

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing) {
      throw new Error(`Conflict: slug "${data.slug}" is already taken`);
    }

    const { data: row, error } = await supabaseAdmin
      .from("restaurants")
      .insert({ name: data.name, slug: data.slug, is_active: true })
      .select("id")
      .single();

    if (error || !row) {
      throw new Error(error?.message ?? "Failed to create restaurant");
    }

    return { id: row.id };
  });

/** GET — Paginated list of all restaurants with member counts */
export const listRestaurants = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((i) => ListRestaurantsSchema.parse(i))
  .handler(async ({ data }): Promise<PaginatedRestaurants> => {
    const supabaseAdmin = await getSupabaseAdmin();
    const { page, pageSize } = data;
    const offset = (page - 1) * pageSize;

    const [{ data: items, error }, { count }] = await Promise.all([
      supabaseAdmin
        .from("restaurants")
        .select("*, restaurant_members(count)")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1),
      supabaseAdmin.from("restaurants").select("id", { count: "exact", head: true }),
    ]);

    if (error) {
      throw new Error(error.message);
    }

    return {
      items: items as PaginatedRestaurants["items"],
      total: count ?? 0,
      page,
      pageSize,
    };
  });

/** GET — Full restaurant details: restaurant, invitations, members */
export const getRestaurantDetails = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((i) => GetRestaurantDetailsSchema.parse(i))
  .handler(async ({ data }): Promise<SuperAdminRestaurantDetails> => {
    const supabaseAdmin = await getSupabaseAdmin();

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("id", data.restaurantId)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      throw new Error(restaurantError?.message ?? "Restaurant not found");
    }

    const [{ data: invitations }, { data: members }] = await Promise.all([
      supabaseAdmin
        .from("restaurant_invitations")
        .select("*")
        .eq("restaurant_id", data.restaurantId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
      supabaseAdmin.rpc("get_restaurant_members_with_email", {
        _restaurant_id: data.restaurantId,
      }),
    ]);

    return {
      restaurant: restaurant as SuperAdminRestaurantDetails["restaurant"],
      invitations: invitations ?? [],
      members: members ?? [],
    };
  });

/** POST — Invite an owner to a restaurant by email */
export const assignOwner = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((i) => AssignOwnerSchema.parse(i))
  .handler(async ({ data }): Promise<InvitationCreated> => {
    const supabaseAdmin = await getSupabaseAdmin();

    // Check if email already owns a restaurant
    const { data: ownsRestaurant } = await supabaseAdmin.rpc("email_owns_restaurant", {
      _email: data.email,
    });
    if (ownsRestaurant) {
      throw new Error(
        `Conflict: ${data.email} already owns a restaurant and cannot be invited as owner`,
      );
    }

    // Check for existing pending invitation for this email + restaurant
    const { data: existing } = await supabaseAdmin
      .from("restaurant_invitations")
      .select("id")
      .eq("restaurant_id", data.restaurantId)
      .eq("email", data.email)
      .is("accepted_at", null)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `Conflict: a pending invitation for ${data.email} already exists for this restaurant`,
      );
    }

    const { data: row, error } = await supabaseAdmin
      .from("restaurant_invitations")
      .insert({
        restaurant_id: data.restaurantId,
        email: data.email,
        role: "owner",
        token: crypto.randomUUID(),
      })
      .select("id, token")
      .single();

    if (error || !row) {
      throw new Error(error?.message ?? "Failed to create invitation");
    }

    return { invitationId: row.id, token: row.token };
  });

/** POST — Invite a staff member (admin or staff role) to a restaurant */
export const assignStaff = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((i) => AssignStaffSchema.parse(i))
  .handler(async ({ data }): Promise<InvitationCreated> => {
    const supabaseAdmin = await getSupabaseAdmin();

    // Check for existing pending invitation for this email + restaurant
    const { data: existing } = await supabaseAdmin
      .from("restaurant_invitations")
      .select("id")
      .eq("restaurant_id", data.restaurantId)
      .eq("email", data.email)
      .is("accepted_at", null)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `Conflict: a pending invitation for ${data.email} already exists for this restaurant`,
      );
    }

    const { data: row, error } = await supabaseAdmin
      .from("restaurant_invitations")
      .insert({
        restaurant_id: data.restaurantId,
        email: data.email,
        role: data.role,
        token: crypto.randomUUID(),
      })
      .select("id, token")
      .single();

    if (error || !row) {
      throw new Error(error?.message ?? "Failed to create invitation");
    }

    return { invitationId: row.id, token: row.token };
  });

/** POST — Toggle restaurant active status */
export const toggleRestaurantStatus = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((i) => ToggleStatusSchema.parse(i))
  .handler(async ({ data }): Promise<ToggleStatusResult> => {
    const supabaseAdmin = await getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("restaurants")
      .update({ is_active: data.isActive })
      .eq("id", data.restaurantId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

/** GET — List all pending invitations for a restaurant */
export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .inputValidator((i) => ListInvitationsSchema.parse(i))
  .handler(async ({ data }): Promise<{ invitations: RestaurantInvitation[] }> => {
    const supabaseAdmin = await getSupabaseAdmin();

    const { data: invitations, error } = await supabaseAdmin
      .from("restaurant_invitations")
      .select("*")
      .eq("restaurant_id", data.restaurantId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { invitations: invitations as RestaurantInvitation[] };
  });

// ---------------------------------------------------------------------------
// Role check server function (used by useSuperAdmin hook)
// ---------------------------------------------------------------------------

/** GET — Check if the current user has super_admin role */
export const checkSuperAdminRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (error || !data) return false;
    return true;
  });

/** GET — Public: look up a single invitation by token */
export const getInvitationByToken = createServerFn({ method: "GET" })
  .inputValidator((i) => GetInvitationByTokenSchema.parse(i))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getSupabaseAdmin();

    const { data: rows, error } = await supabaseAdmin.rpc("get_invitation_by_token", {
      _token: data.token,
    });

    if (error) {
      throw new Error(error.message);
    }

    const invitation = rows?.[0] as
      | {
          id: string;
          restaurant_id: string;
          email: string;
          role: string;
          accepted_at: string | null;
        }
      | undefined;

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    return { invitation };
  });
