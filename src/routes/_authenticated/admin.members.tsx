/**
 * Admin Members — Owner can invite admins and staff to their restaurant
 */

import { createFileRoute, Link, useSearch, redirect } from "@tanstack/react-router";
import { useCurrentUserAccess } from "@/features/auth";
import { InviteForm } from "@/features/restaurants";
import { Container } from "@/shared/components/container";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/members")({
  component: MembersAdmin,
});

function MembersAdmin() {
  const search = useSearch({ from: "/_authenticated/admin" });
  const { memberships, isSuperAdmin, canManageMembers } = useCurrentUserAccess();

  const activeRestaurantId = search.restaurantId ?? memberships[0]?.restaurantId ?? null;
  const activeMembership = memberships.find((m) => m.restaurantId === activeRestaurantId);

  // Route guard: must be owner of the active restaurant (or super_admin)
  if (!activeRestaurantId) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No tienes un restaurante activo seleccionado.
        </p>
      </div>
    );
  }

  if (!isSuperAdmin && !canManageMembers(activeRestaurantId)) {
    return (
      <div className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 p-8 text-center">
        <h2 className="font-display text-xl text-destructive">Acceso denegado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Solo los propietarios pueden gestionar miembros del restaurante.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin"
          search={{ restaurantId: activeRestaurantId }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl">Miembros</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invita administradores y personal a {activeMembership?.restaurantName ?? "tu restaurante"}.
          </p>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-soft)] max-w-lg">
        <h2 className="font-display text-lg mb-4">Enviar invitacion</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Los usuarios invitados recibiran un enlace por email para unirse al restaurante.
        </p>
        <InviteForm restaurantId={activeRestaurantId} />
      </div>
    </div>
  );
}
