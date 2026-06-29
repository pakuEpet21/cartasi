/**
 * Feature Flags Admin — Super Admin only
 * Allows super_admin to configure feature flags for any restaurant.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DEFAULT_FLAGS,
  updateFlags,
  type FeatureFlags,
  type FlagName,
} from "@/features/flags";
import { listRestaurants } from "@/features/restaurants";
import { useCurrentUserAccess } from "@/features/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/flags")({
  component: FlagsAdmin,
});

// Flags that are managed statically via features.json (not DB feature_flags)
const STATIC_FLAGS: FlagName[] = ["reviews", "socialLinks", "openingHours"];

const FLAG_GROUPS: { title: string; flags: FlagName[] }[] = [
  { title: "Carta", flags: ["menuFilters", "search", "allergenInfo", "calorieInfo", "productImages", "staffPicker"] },
  { title: "Promocion", flags: ["banner", "promotions", "gallery"] },
  { title: "Pedidos", flags: ["cart", "whatsappOrder", "qrMenu", "tableOrdering", "deliveryTracking"] },
  { title: "Engagement", flags: ["chatbot", "reservations", "loyaltyProgram", "minigame"] },
  { title: "Plataforma", flags: ["multiLanguage", "adminPanel"] },
];

function FlagsAdmin() {
  const { isSuperAdmin, isLoading: accessLoading } = useCurrentUserAccess();
  const qc = useQueryClient();

  // Fetch all restaurants for the picker
  const restaurantsQuery = useSuspenseQuery({
    queryKey: ["super-admin", "restaurants", "all"],
    queryFn: () => listRestaurants({ data: { page: 1, pageSize: 100 } }),
  });

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Default to first restaurant if none selected
  useEffect(() => {
    if (!selectedRestaurantId && restaurantsQuery.data?.items?.length) {
      setSelectedRestaurantId(restaurantsQuery.data.items[0].id);
    }
  }, [restaurantsQuery.data, selectedRestaurantId]);

  // Fetch feature flags for selected restaurant
  const flagsQuery = useSuspenseQuery({
    queryKey: ["restaurant-config", "by-id", selectedRestaurantId],
    queryFn: async () => {
      if (!selectedRestaurantId) return null;
      // Use the admin function to get flags directly
      const { getRestaurantConfig } = await import("@/features/flags/flags.functions");
      const restaurant = restaurantsQuery.data?.items?.find((r) => r.id === selectedRestaurantId);
      if (!restaurant) return null;
      return getRestaurantConfig({ data: { slug: restaurant.slug } });
    },
    enabled: !!selectedRestaurantId,
  });

  const [draft, setDraft] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    if (flagsQuery.data?.flags) {
      setDraft(flagsQuery.data.flags);
    }
  }, [flagsQuery.data?.flags]);

  const mutation = useMutation({
    mutationFn: async (flags: FeatureFlags) => {
      if (!selectedRestaurantId) throw new Error("Sin restaurante seleccionado");
      return updateFlags({ data: { restaurantId: selectedRestaurantId, flags } });
    },
    onSuccess: () => {
      toast.success("Flags actualizados");
      qc.invalidateQueries({ queryKey: ["restaurant-config"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error al guardar"),
  });

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 p-8 text-center">
        <h2 className="font-display text-xl text-destructive">Solo super admin</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No tienes permisos para acceder a esta seccion.
        </p>
      </div>
    );
  }

  const restaurant = restaurantsQuery.data?.items?.find((r) => r.id === selectedRestaurantId);
  const dirty = draft && flagsQuery.data?.flags
    ? Object.keys(DEFAULT_FLAGS).some(
        (k) => draft[k as FlagName] !== flagsQuery.data?.flags?.[k as FlagName],
      )
    : false;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Feature flags</h1>
          <p className="text-sm text-muted-foreground">
            Activa o desactiva modulos sin tocar el codigo.
          </p>
        </div>

        {/* Restaurant picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Restaurante:</span>
          <Select
            value={selectedRestaurantId ?? ""}
            onValueChange={setSelectedRestaurantId}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecciona restaurante" />
            </SelectTrigger>
            <SelectContent>
              {restaurantsQuery.data?.items?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {restaurant && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{restaurant.slug}</Badge>
          <span className="text-xs text-muted-foreground">
            ID: {restaurant.id}
          </span>
        </div>
      )}

      {!draft ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            {selectedRestaurantId ? "Cargando flags..." : "Selecciona un restaurante"}
          </p>
        </div>
      ) : (
        <>
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
                        onChange={(v) => setDraft((d) => d ? ({ ...d, [name]: v }) : d)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {/* Static flags managed via features.json */}
            <section className="rounded-[var(--radius)] border border-dashed border-muted bg-card p-5">
              <h2 className="font-display text-lg text-muted-foreground">Flags estaticos</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Gestionados via <code className="text-xs">features.json</code>, no editable desde aqui.
              </p>
              <ul className="mt-3 divide-y divide-border">
                {STATIC_FLAGS.map((name) => (
                  <li key={name} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        Valor actual: {flagsQuery.data?.flags?.[name] ? "activo" : "inactivo"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">—</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="flex justify-end">
            <button
              disabled={!dirty || mutation.isPending}
              onClick={() => draft && mutation.mutate(draft)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </>
      )}
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
