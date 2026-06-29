/**
 * Admin Menu View — Staff read-only view of the restaurant menu
 */

import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCurrentUserAccess } from "@/features/auth";
import { getMenu, MenuGrid } from "@/features/menu";
import { Container } from "@/shared/components/container";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/menu-view")({
  component: MenuViewAdmin,
});

function MenuViewAdmin() {
  const search = useSearch({ from: "/_authenticated/admin" });
  const { memberships, isSuperAdmin, canManageMenu, canViewMenu } = useCurrentUserAccess();

  const activeRestaurantId = search.restaurantId ?? memberships[0]?.restaurantId ?? null;
  const activeMembership = memberships.find((m) => m.restaurantId === activeRestaurantId);

  // Route guard: must have view access (owner, admin, or staff) but NOT manage menu
  if (!activeRestaurantId) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No tienes un restaurante activo seleccionado.
        </p>
      </div>
    );
  }

  // Super admin or those who can manage menu should use the regular menu admin
  if (isSuperAdmin || canManageMenu(activeRestaurantId)) {
    return (
      <div className="space-y-4">
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Este modo es para personal con acceso de solo lectura.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Los administradores deben usar la seccion de gestion de platos.
          </p>
        </div>
        <Link
          to="/admin/menu"
          search={{ restaurantId: activeRestaurantId }}
          className="block rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elev)]"
        >
          <h2 className="font-display text-lg">Ir a gestion de platos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accede a la gestion completa del menu.
          </p>
        </Link>
      </div>
    );
  }

  if (!canViewMenu(activeRestaurantId)) {
    return (
      <div className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 p-8 text-center">
        <h2 className="font-display text-xl text-destructive">Acceso denegado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No tienes permisos para ver el menu de este restaurante.
        </p>
      </div>
    );
  }

  // Fetch menu data
  const menuQuery = useSuspenseQuery({
    queryKey: ["menu", activeRestaurantId],
    queryFn: () => getMenu({ data: { restaurantId: activeRestaurantId } }),
  });

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
          <h1 className="font-display text-2xl">Ver carta</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              Solo lectura
            </Badge>
            {activeMembership && (
              <span className="text-sm text-muted-foreground">
                {activeMembership.restaurantName}
              </span>
            )}
          </div>
        </div>
      </div>

      {menuQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-[var(--radius)]" />
          ))}
        </div>
      ) : menuQuery.isError ? (
        <div className="rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-sm text-destructive">
            Error al cargar el menu. Intenta de nuevo mas tarde.
          </p>
        </div>
      ) : menuQuery.data?.items?.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Este restaurante aun no tiene platos publicados.</p>
        </div>
      ) : (
        <MenuGrid items={menuQuery.data?.items ?? []} currency="EUR" />
      )}
    </div>
  );
}
