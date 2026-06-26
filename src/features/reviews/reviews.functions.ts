import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Review = {
  id: string;
  author: string;
  body: string | null;
  rating: number;
  created_at: string;
};

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getReviews = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ restaurantId: z.string().uuid() }).parse(i))
  .handler(async ({ data }): Promise<Review[]> => {
    const sb = pub();
    const { data: rows } = await sb
      .from("reviews")
      .select("id,author,body,rating,created_at")
      .eq("restaurant_id", data.restaurantId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(20);
    return (rows ?? []) as Review[];
  });
