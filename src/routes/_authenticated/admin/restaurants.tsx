/**
 * Super Admin Restaurant Management — Restaurant list page
 * Super admin only.
 */

import { createFileRoute } from "@tanstack/react-router";
import { RestaurantList } from "@/features/restaurants/components/restaurant-list";
import { useSuperAdmin } from "@/features/restaurants";

export const Route = createFileRoute("/_authenticated/admin/restaurants")({
  head: () => ({
    meta: [{ title: "Restaurantes — Admin" }],
  }),
  component: RestaurantListPage,
});

function RestaurantListPage() {
  const { isSuperAdmin, isLoading } = useSuperAdmin();

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Restaurantes</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion de restaurantes y miembros</p>
      </div>
      <RestaurantList />
    </div>
  );
}
