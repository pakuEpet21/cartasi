import { motion } from "framer-motion";
import { MenuCard } from "./menu-card";
import { stagger } from "@/shared/motion";
import type { MenuItem } from "../types";

export function MenuGrid({ items, currency }: { items: MenuItem[]; currency: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border p-12 text-center text-muted-foreground">
        No hay platos que coincidan con tu búsqueda.
      </div>
    );
  }
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item) => (
        <MenuCard key={item.id} item={item} currency={currency} />
      ))}
    </motion.div>
  );
}