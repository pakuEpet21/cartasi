import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/shared/motion";
import type { MenuItem } from "@/features/menu";

export function GallerySection({ items }: { items: MenuItem[] }) {
  const photos = items.filter((i) => i.image_url).slice(0, 8);
  if (photos.length === 0) return null;
  return (
    <section id="galeria" className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Galería</p>
        <h2 className="mt-1 font-display text-2xl sm:text-3xl">Una mirada al plato</h2>
      </header>
      <motion.div
        variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
      >
        {photos.map((p) => (
          <motion.figure
            key={p.id} variants={fadeUp}
            className="group relative aspect-square overflow-hidden rounded-[var(--radius)]"
          >
            <img
              src={p.image_url!} alt={p.name} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-2 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
              {p.name}
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}