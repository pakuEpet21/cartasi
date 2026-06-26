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
*** Add File: src/features/reviews/components/reviews-section.tsx
import { useState } from "react";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fadeUp, stagger } from "@/shared/motion";
import { getReviews } from "../reviews.functions";

const reviewsQuery = (id: string) =>
  queryOptions({ queryKey: ["reviews", id], queryFn: () => getReviews({ data: { restaurantId: id } }) });

export function ReviewsSection({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data: reviews } = useSuspenseQuery(reviewsQuery(restaurantId));
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const author = String(fd.get("author"));
    const body = (fd.get("body") as string) || null;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      restaurant_id: restaurantId,
      author, body, rating, is_approved: false,
    });
    setSubmitting(false);
    if (error) { toast.error("No se pudo enviar la reseña"); return; }
    toast.success("Reseña enviada. Será visible tras aprobación.");
    (e.target as HTMLFormElement).reset();
    setRating(5);
    qc.invalidateQueries({ queryKey: ["reviews", restaurantId] });
  }

  return (
    <section id="resenas" className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Reseñas</p>
        <h2 className="mt-1 font-display text-2xl sm:text-3xl">Lo que dicen nuestros clientes</h2>
      </header>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sé el primero en dejar una reseña.</p>
      ) : (
        <motion.ul variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <motion.li key={r.id} variants={fadeUp} className="rounded-[var(--radius)] border border-border bg-card p-5">
              <Stars value={r.rating} />
              {r.body && <p className="mt-2 text-sm text-foreground/90">"{r.body}"</p>}
              <p className="mt-3 text-xs text-muted-foreground">— {r.author}</p>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <form onSubmit={onSubmit} className="rounded-[var(--radius)] border border-border bg-card p-5 space-y-3">
        <h3 className="font-medium">Deja tu reseña</h3>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button" key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} estrellas`}
              className="p-0.5"
            >
              <Star className={`h-5 w-5 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <input
          name="author" required placeholder="Tu nombre"
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
        />
        <textarea
          name="body" rows={3} placeholder="Cuéntanos tu experiencia"
          className="w-full rounded-md border border-border bg-background p-2 text-sm"
        />
        <button
          disabled={submitting}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Publicar"}
        </button>
      </form>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= value ? "fill-primary text-primary" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}