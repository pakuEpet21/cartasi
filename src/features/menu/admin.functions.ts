import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AllergenZ = z.enum([
  "gluten","lactose","nuts","egg","fish","shellfish","soy","sesame",
  "celery","mustard","sulphites","lupin","molluscs","peanuts",
]);

const ItemSchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable(),
  price_cents: z.number().int().min(0),
  image_url: z.string().url().nullable().or(z.literal("")).transform((v) => v || null),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  allergens: z.array(AllergenZ),
  calories: z.number().int().min(0).nullable(),
  position: z.number().int(),
});

export const upsertMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ItemSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("menu_items").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("menu_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  restaurant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  position: z.number().int(),
  is_active: z.boolean(),
});

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CategorySchema.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });