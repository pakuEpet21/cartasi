/**
 * Super Admin Restaurant Management — Restaurant detail page
 * Super admin only.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { RestaurantDetail } from "@/features/restaurants/components/restaurant-detail";
import { useSuperAdmin } from "@/features/restaurants";

export const Route = createFileRoute("/_authenticated/admin/restaurants/$id")({
  head: () => ({
    meta: [{ title: "Restaurante — Admin" }],
  }),
  component: RestaurantDetailPage,
});

function RestaurantDetailPage() {
  const { isSuperAdmin, isLoading } = useSuperAdmin();
  const { id } = Route.useParams();

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
      <div className="flex items-center gap-3">
        <Link
          to="/admin/restaurants"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl">Detalle del restaurante</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informacion, miembros e invitaciones
          </p>
        </div>
      </div>

      <RestaurantDetail restaurantId={id} />
    </div>
  );
}
