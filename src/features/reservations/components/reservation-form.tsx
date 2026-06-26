import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fadeUp } from "@/shared/motion";

export function ReservationForm({ restaurantId }: { restaurantId: string }) {
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const date = String(form.get("date"));
    const time = String(form.get("time"));
    const slot_at = new Date(`${date}T${time}:00`).toISOString();
    const payload = {
      restaurant_id: restaurantId,
      name: String(form.get("name")),
      email: (form.get("email") as string) || null,
      phone: (form.get("phone") as string) || null,
      party_size: Number(form.get("party_size")),
      notes: (form.get("notes") as string) || null,
      slot_at,
    };
    setSubmitting(true);
    const { error } = await supabase.from("reservations").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo registrar la reserva");
      return;
    }
    toast.success("¡Reserva recibida! Te contactaremos para confirmar.");
    (e.target as HTMLFormElement).reset();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <motion.section
      id="reservas"
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
      variants={fadeUp}
      className="rounded-[calc(var(--radius)+4px)] border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <header className="mb-5">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Reservas</p>
        <h2 className="mt-1 font-display text-2xl sm:text-3xl">Reserva tu mesa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirmaremos por email o teléfono en menos de 24h.
        </p>
      </header>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="name" required />
        <Field label="Personas" name="party_size" type="number" min={1} max={30} defaultValue={2} required />
        <Field label="Fecha" name="date" type="date" min={today} required />
        <Field label="Hora" name="time" type="time" required />
        <Field label="Email" name="email" type="email" />
        <Field label="Teléfono" name="phone" type="tel" />
        <div className="sm:col-span-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Comentarios
          </label>
          <textarea
            name="notes" rows={3}
            className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Solicitar reserva"}
        </button>
      </form>
    </motion.section>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        {...rest}
        className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
      />
    </label>
  );
}