import { motion } from "framer-motion";
import { useFlag } from "@/features/flags";
import { formatPrice } from "@/shared/lib/format";
import { ALLERGEN_LABELS, type MenuItem } from "../types";
import { fadeUp, hoverLift } from "@/shared/motion";
import { AddToCartButton } from "@/features/cart";
import { Star } from "lucide-react";

export function MenuCard({ item, currency }: { item: MenuItem; currency: string }) {
  const showImage = useFlag("productImages");
  const showAllergens = useFlag("allergenInfo");
  const showCalories = useFlag("calorieInfo");
  const showStaffPick = useFlag("staffPicker");
  const cartEnabled = useFlag("cart");

  return (
    <motion.article
      variants={fadeUp}
      {...hoverLift}
      className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elev)]"
    >
      {showImage && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {showStaffPick && item.is_featured && (
            <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm">
              <Star className="h-3 w-3 fill-primary" />
              Recomendado
            </span>
          )}
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <span className="font-display text-2xl">{item.name.charAt(0)}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-tight">{item.name}</h3>
          <span className="shrink-0 font-medium text-primary">
            {formatPrice(item.price_cents, currency)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {showAllergens && item.allergens.length > 0 && item.allergens.map((a) => (
            <span
              key={a}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {ALLERGEN_LABELS[a] ?? a}
            </span>
          ))}
          {showCalories && item.calories != null && item.calories > 0 && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.calories} kcal
            </span>
          )}
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
            >
              {t}
            </span>
          ))}
        </div>
        {cartEnabled && (
          <div className="pt-3">
            <AddToCartButton
              id={item.id}
              name={item.name}
              priceCents={item.price_cents}
              imageUrl={item.image_url}
            />
          </div>
        )}
      </div>
    </motion.article>
  );
}