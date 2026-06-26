import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DEFAULT_FLAGS, getRestaurantConfig, updateFlags,
  type FeatureFlags, type FlagName,
} from "@/features/flags";
import { ACTIVE_RESTAURANT_SLUG } from "@/shared/config";

export const Route = createFileRoute("/_authenticated/admin/flags")({
  component: FlagsAdmin,
});

const FLAG_GROUPS: { title: string; flags: FlagName[] }[] = [
  { title: "Carta", flags: ["menuFilters", "search", "allergenInfo", "calorieInfo", "productImages", "staffPicker"] },
  { title: "Promoción", flags: ["banner", "promotions", "gallery", "socialLinks", "openingHours"] },
  { title: "Pedidos", flags: ["cart", "whatsappOrder", "qrMenu", "tableOrdering", "deliveryTracking"] },
  { title: "Engagement", flags: ["chatbot", "reservations", "reviews", "loyaltyProgram", "minigame"] },
  { title: "Plataforma", flags: ["multiLanguage", "adminPanel"] },
];

function FlagsAdmin() {
  const qc = useQueryClient();
  const cfg = useSuspenseQuery({
    queryKey: ["restaurant-config", ACTIVE_RESTAURANT_SLUG],
    queryFn: () => getRestaurantConfig({ data: { slug: ACTIVE_RESTAURANT_SLUG } }),
  });
  const restaurantId = cfg.data.restaurant?.id;
  const [draft, setDraft] = useState<FeatureFlags>(cfg.data.flags);

  useEffect(() => setDraft(cfg.data.flags), [cfg.data.flags]);

  const mutation = useMutation({
    mutationFn: async (flags: FeatureFlags) => {
      if (!restaurantId) throw new Error("Sin restaurante activo");
      return updateFlags({ data: { restaurantId, flags } });
    },
    onSuccess: () => {
      toast.success("Flags actualizados");
      qc.invalidateQueries({ queryKey: ["restaurant-config"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error al guardar"),
  });

  const dirty = Object.keys(DEFAULT_FLAGS).some(
    (k) => draft[k as FlagName] !== cfg.data.flags[k as FlagName],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Feature flags</h1>
          <p className="text-sm text-muted-foreground">
            Activa o desactiva módulos sin tocar el código.
          </p>
        </div>
        <button
          disabled={!dirty || mutation.isPending}
          onClick={() => mutation.mutate(draft)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </header>

      <div className="space-y-6">
        {FLAG_GROUPS.map((group) => (
          <section
            key={group.title}
            className="rounded-[var(--radius)] border border-border bg-card p-5"
          >
            <h2 className="font-display text-lg">{group.title}</h2>
            <ul className="mt-3 divide-y divide-border">
              {group.flags.map((name) => (
                <li key={name} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      Por defecto: {DEFAULT_FLAGS[name] ? "activo" : "inactivo"}
                    </p>
                  </div>
                  <FlagToggle
                    checked={draft[name]}
                    onChange={(v) => setDraft((d) => ({ ...d, [name]: v }))}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function FlagToggle({
  checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}