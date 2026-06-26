import { motion } from "framer-motion";
import type { Promotion } from "@/features/menu";
import { popIn } from "@/shared/motion";

export function PromoBanner({ promotion }: { promotion: Promotion }) {
  return (
    <motion.div
      variants={popIn}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-[calc(var(--radius)+4px)] border border-border bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-[var(--shadow-elev)] sm:p-8"
    >
      <h2 className="font-display text-2xl sm:text-3xl">{promotion.title}</h2>
      {promotion.body && (
        <p className="mt-2 max-w-xl text-sm opacity-90 sm:text-base">{promotion.body}</p>
      )}
      {promotion.cta_label && promotion.cta_url && (
        <a
          href={promotion.cta_url}
          className="mt-4 inline-flex items-center rounded-full bg-background/95 px-5 py-2 text-sm font-medium text-foreground transition-transform hover:scale-[1.02]"
        >
          {promotion.cta_label}
        </a>
      )}
    </motion.div>
  );
}