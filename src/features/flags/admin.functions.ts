import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveFlags } from "./defaults";
import type { FeatureFlags } from "./types";

const FlagsUpdateSchema = z.object({
  restaurantId: z.string().uuid(),
  flags: z.record(z.string(), z.boolean()),
});

/** Owner/admin only — RLS on `feature_flags` enforces the role check too. */
export const updateFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => FlagsUpdateSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ flags: FeatureFlags }> => {
    const { error, data: row } = await context.supabase
      .from("feature_flags")
      .upsert(
        { restaurant_id: data.restaurantId, flags: data.flags },
        { onConflict: "restaurant_id" },
      )
      .select("flags")
      .single();
    if (error) throw new Error(error.message);
    return { flags: resolveFlags((row.flags as Partial<FeatureFlags> | null) ?? null) };
  });