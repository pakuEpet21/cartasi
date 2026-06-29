/**
 * Admin Categories — Owner/Admin only
 * Placeholder for category management (not yet implemented).
 */

import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useCurrentUserAccess } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
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
          Solo propietarios y administradores pueden gestionar categorias.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
      <h1 className="font-display text-2xl">Categorias</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        upsertCategory / deleteCategory disponibles en features/menu.
      </p>
    </div>
  );
}
