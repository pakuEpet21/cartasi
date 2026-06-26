import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: () => (
    <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
      <h1 className="font-display text-2xl">Platos</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        CRUD UI pendiente. La lógica de datos (upsertMenuItem / deleteMenuItem) ya está en features/menu.
      </p>
    </div>
  ),
});