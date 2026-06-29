/**
 * Admin Dashboard — Role-aware cards based on user permissions
 */

import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useAuth, useCurrentUserAccess } from "@/features/auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "Propietario",
  admin: "Administrador",
  staff: "Personal",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800 border-purple-200",
  owner: "bg-blue-100 text-blue-800 border-blue-200",
  admin: "bg-green-100 text-green-800 border-green-200",
  staff: "bg-gray-100 text-gray-800 border-gray-200",
};

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { user } = useAuth();
  const { appRoles, memberships, isSuperAdmin, canManageMenu, canManageMembers, canViewMenu } = useCurrentUserAccess();
  const search = useSearch({ from: "/_authenticated/admin" });

  const activeRestaurantId = search.restaurantId ?? memberships[0]?.restaurantId ?? null;
  const activeMembership = memberships.find((m) => m.restaurantId === activeRestaurantId);

  // Build role badges for display
  const roleBadges = appRoles.map((role) => (
    <Badge key={role} variant="outline" className={cn("text-xs", ROLE_COLORS[role])}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  ));

  // Super admin cards
  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl">Bienvenido</h1>
          <p className="text-sm text-muted-foreground">
            {user?.email ?? "Sesion activa"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {roleBadges}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            to="/admin/restaurants"
            title="Restaurantes"
            desc="Gestiona restaurantes, miembros e invitaciones."
          />
          <DashboardCard
            to="/admin/flags"
            title="Feature flags"
            desc="Configura funcionalidades por restaurante."
          />
        </div>
      </div>
    );
  }

  // Owner/Admin/Staff cards based on permissions
  const cards: { to: string; title: string; desc: string; condition: boolean }[] = [
    {
      to: "/admin/menu",
      title: "Platos",
      desc: "Crea, edita y publica los platos de la carta.",
      condition: !!activeRestaurantId && canManageMenu(activeRestaurantId),
    },
    {
      to: "/admin/categories",
      title: "Categorias",
      desc: "Organiza la estructura del menu.",
      condition: !!activeRestaurantId && canManageMenu(activeRestaurantId),
    },
    {
      to: "/admin/theme",
      title: "Tema visual",
      desc: "Cambia colores, tipografia y radios sin tocar codigo.",
      condition: !!activeRestaurantId && canManageMenu(activeRestaurantId),
    },
    {
      to: "/admin/members",
      title: "Miembros",
      desc: "Invita administradores y personal al restaurante.",
      condition: !!activeRestaurantId && canManageMembers(activeRestaurantId),
    },
    {
      to: "/admin/menu-view",
      title: "Ver carta",
      desc: "Vista de solo lectura del menu del restaurante.",
      condition: !!activeRestaurantId && !canManageMenu(activeRestaurantId) && canViewMenu(activeRestaurantId),
    },
  ];

  const visibleCards = cards.filter((c) => c.condition);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">
          {user?.email ?? "Sesion activa"}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {roleBadges}
          {activeMembership && (
            <Badge variant="outline" className="text-xs">
              {activeMembership.restaurantName}
            </Badge>
          )}
        </div>
      </div>

      {visibleCards.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tienes acceso a ninguna seccion del panel.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Contacta al propietario del restaurante para obtener acceso.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleCards.map((card) => (
            <DashboardCard
              key={card.to}
              to={card.to}
              search={{ restaurantId: activeRestaurantId }}
              title={card.title}
              desc={card.desc}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  to,
  search,
  title,
  desc,
}: {
  to: string;
  search?: { restaurantId: string | null };
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="block rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elev)]"
    >
      <h2 className="font-display text-lg">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
