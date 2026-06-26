import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { resolveFlags } from "./defaults";
import type { FeatureFlags } from "./types";

export type RestaurantConfig = {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    logo_url: string | null;
    cover_url: string | null;
    locale: string;
    currency: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    theme: Json;
  } | null;
  flags: FeatureFlags;
};

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Loads the active restaurant + its feature flags. Called from the root
 * loader so flags are hydrated server-side (no client flash).
 */
export const getRestaurantConfig = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }): Promise<RestaurantConfig> => {
    const sb = publicClient();
    const { data: restaurant } = await sb
      .from("restaurants")
      .select(
        "id,slug,name,tagline,description,logo_url,cover_url,locale,currency,address,phone,email,theme",
      )
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!restaurant) {
      return { restaurant: null, flags: resolveFlags(null) };
    }

    const { data: flagRow } = await sb
      .from("feature_flags")
      .select("flags")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();

    return {
      restaurant: { ...restaurant, theme: restaurant.theme ?? {} },
      flags: resolveFlags((flagRow?.flags as Partial<FeatureFlags> | null) ?? null),
    };
  });