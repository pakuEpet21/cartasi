import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Allergen, Category, MenuItem, Promotion } from "./types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const RestaurantId = z.object({ restaurantId: z.string().uuid() });

export const getMenu = createServerFn({ method: "GET" })
  .inputValidator((i) => RestaurantId.parse(i))
  .handler(async ({ data }): Promise<{ categories: Category[]; items: MenuItem[] }> => {
    const sb = pub();
    const [{ data: categories }, { data: items }] = await Promise.all([
      sb.from("categories").select("id,name,slug,position,is_active")
        .eq("restaurant_id", data.restaurantId).eq("is_active", true).order("position"),
      sb.from("menu_items").select(
        "id,restaurant_id,category_id,slug,name,description,price_cents,image_url,is_active,is_featured,position,allergens,calories,tags",
      ).eq("restaurant_id", data.restaurantId).eq("is_active", true).order("position"),
    ]);
    return {
      categories: (categories ?? []) as Category[],
      items: ((items ?? []) as unknown) as MenuItem[],
    };
  });

export const getPromotions = createServerFn({ method: "GET" })
  .inputValidator((i) => RestaurantId.parse(i))
  .handler(async ({ data }): Promise<Promotion[]> => {
    const sb = pub();
    const { data: rows } = await sb.from("promotions")
      .select("id,title,body,image_url,cta_label,cta_url")
      .eq("restaurant_id", data.restaurantId).eq("is_active", true)
      .order("position");
    return (rows ?? []) as Promotion[];
  });

export type { Allergen, Category, MenuItem, Promotion };