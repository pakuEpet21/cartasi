/**
 * Super Admin Restaurant Management — Create restaurant page
 * PR 3: Admin UI
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { CreateRestaurantForm } from "@/features/restaurants/components/create-restaurant-form";

export const Route = createFileRoute("/_authenticated/admin/restaurants/new")({
  head: () => ({
    meta: [{ title: "Nuevo restaurante — Admin" }],
  }),
  component: NewRestaurantPage,
});

function NewRestaurantPage() {
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
          <h1 className="font-display text-2xl">Nuevo restaurante</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea un nuevo restaurante en la plataforma
          </p>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-soft)] max-w-lg">
        <CreateRestaurantForm />
      </div>
    </div>
  );
}
