/**
 * Super Admin Restaurant Management — Restaurant detail page
 * PR 3: Admin UI
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { RestaurantDetail } from "@/features/restaurants/components/restaurant-detail";

export const Route = createFileRoute("/_authenticated/admin/restaurants/$id")({
  head: () => ({
    meta: [{ title: "Restaurante — Admin" }],
  }),
  component: RestaurantDetailPage,
});

function RestaurantDetailPage() {
  const { id } = Route.useParams();

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
            Información, miembros e invitaciones
          </p>
        </div>
      </div>

      <RestaurantDetail restaurantId={id} />
    </div>
  );
}