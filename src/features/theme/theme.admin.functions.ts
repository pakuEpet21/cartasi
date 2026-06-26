import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ThemeUpdateSchema = z.object({
  restaurantId: z.string().uuid(),
  theme: z.record(z.string(), z.any()),
});

export const updateTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ThemeUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("restaurants")
      .update({ theme: data.theme })
      .eq("id", data.restaurantId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });