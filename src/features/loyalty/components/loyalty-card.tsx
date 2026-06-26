import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coffee } from "lucide-react";
import { toast } from "sonner";
import { fadeUp } from "@/shared/motion";

const TARGET = 10;
const KEY = (slug: string) => `lbt-loyalty-${slug}`;

export function LoyaltyCard({ slug, reward }: { slug: string; reward?: string }) {
  const [stamps, setStamps] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(slug));
      if (raw) setStamps(Math.max(0, Math.min(TARGET, Number(raw) || 0)));
    } catch { /* noop */ }
  }, [slug]);

  function save(n: number) {
    setStamps(n);
    try { localStorage.setItem(KEY(slug), String(n)); } catch { /* noop */ }
  }

  function addStamp() {
    if (stamps >= TARGET) return;
    const n = stamps + 1;
    save(n);
    if (n === TARGET) toast.success(`¡Premio desbloqueado! ${reward ?? "Un postre gratis en tu próxima visita."}`);
  }

  return (
    <motion.section
      id="fidelidad"
      variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
      className="rounded-[calc(var(--radius)+4px)] border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Programa de fidelidad</p>
        <h2 className="mt-1 font-display text-2xl">Tu tarjeta de sellos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {reward ?? `Consigue ${TARGET} sellos y recibe un postre gratis.`}
        </p>
      </header>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: TARGET }).map((_, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-full border ${
              i < stamps
                ? "border-primary bg-primary text-primary-foreground"
                : "border-dashed border-border text-muted-foreground/40"
            }`}
          >
            <Coffee className="h-4 w-4" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{stamps}/{TARGET} sellos</span>
        <div className="flex gap-2">
          <button
            onClick={() => save(0)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reiniciar
          </button>
          <button
            onClick={addStamp}
            disabled={stamps >= TARGET}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Añadir sello
          </button>
        </div>
      </div>
    </motion.section>
  );
}