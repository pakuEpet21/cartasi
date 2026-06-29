/**
 * Admin Theme — Owner/Admin only
 * Placeholder for theme editing (not yet fully implemented).
 */

import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useCurrentUserAccess } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/theme")({
  component: ThemeAdmin,
});

function ThemeAdmin() {
  const search = useSearch({ from: "/_authenticated/admin" });
  const { memberships, isSuperAdmin, canManageMenu } = useCurrentUserAccess();

  const activeRestaurantId = search.restaurantId ?? memberships[0]?.restaurantId ?? null;

  // Route guard
  if (!activeRestaurantId) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No tienes un restaurante activo seleccionado.
        </p>
      </div>
    );
  }

  if (!isSuperAdmin && !canManageMenu(activeRestaurantId)) {
    return (
      <div className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 p-8 text-center">
        <h2 className="font-display text-xl text-destructive">Acceso denegado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Solo propietarios y administradores pueden gestionar el tema visual.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
      <h1 className="font-display text-2xl">Tema visual</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Edita colores, radios y tipografia. updateTheme disponible en features/theme.
      </p>
    </div>
  );
}
