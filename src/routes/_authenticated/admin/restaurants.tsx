/**
 * Super Admin Restaurant Management — Restaurant list page
 * PR 3: Admin UI
 */

import { createFileRoute } from "@tanstack/react-router";
import { RestaurantList } from "@/features/restaurants/components/restaurant-list";

export const Route = createFileRoute("/_authenticated/admin/restaurants")({
  head: () => ({
    meta: [{ title: "Restaurantes — Admin" }],
  }),
  component: RestaurantListPage,
});

function RestaurantListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Restaurantes</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de restaurantes y miembros</p>
      </div>
      <RestaurantList />
    </div>
  );
}
