import { motion } from "framer-motion";
import type { Promotion } from "@/features/menu";
import { popIn, stagger } from "@/shared/motion";

export function PromoStrip({ promotions }: { promotions: Promotion[] }) {
  if (promotions.length === 0) return null;
  return (
    <motion.div
      variants={stagger} initial="hidden" animate="visible"
      className="grid gap-3 sm:grid-cols-2"
    >
      {promotions.map((p) => (
        <motion.div
          key={p.id} variants={popIn}
          className="rounded-[var(--radius)] border border-border bg-card p-5"
        >
          <h3 className="font-display text-lg">{p.title}</h3>
          {p.body && <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>}
          {p.cta_label && p.cta_url && (
            <a href={p.cta_url} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              {p.cta_label} →
            </a>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}