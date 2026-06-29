/**
 * Admin Layout — Role-aware navigation with restaurant switcher
 */

import { createFileRoute, Outlet, Link, useRouterState, useSearch } from "@tanstack/react-router";
import { signOut } from "@/features/auth";
import { useCurrentUserAccess, type UserMembership } from "@/features/auth";
import { Container } from "@/shared/components/container";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Panel — CartaSI" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useSearch({ from: "/_authenticated/admin" });
  const { appRoles, memberships, isSuperAdmin, canManageMenu, canManageMembers, canViewMenu } = useCurrentUserAccess();

  // Build role badges
  const roleBadges = appRoles.map((role) => (
    <Badge key={role} variant="outline" className={cn("text-xs", ROLE_COLORS[role])}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  ));

  // Restaurant switcher: only show if user has multiple memberships
  const showRestaurantSwitcher = memberships.length > 1;
  const activeRestaurantId = search.restaurantId ?? memberships[0]?.restaurantId ?? null;

  // Build navigation items based on role
  const navItems: { to: string; label: string; condition: boolean }[] = [
    // Super admin specific
    { to: "/admin/restaurants", label: "Restaurantes", condition: isSuperAdmin },
    { to: "/admin/flags", label: "Feature flags", condition: isSuperAdmin },
    // Owner/Admin/Staff shared (but menu management only for owner/admin)
    { to: "/admin/menu", label: "Platos", condition: !!activeRestaurantId && canManageMenu(activeRestaurantId) },
    { to: "/admin/categories", label: "Categorias", condition: !!activeRestaurantId && canManageMenu(activeRestaurantId) },
    { to: "/admin/theme", label: "Tema visual", condition: !!activeRestaurantId && canManageMenu(activeRestaurantId) },
    { to: "/admin/members", label: "Miembros", condition: !!activeRestaurantId && canManageMembers(activeRestaurantId) },
    // Staff read-only
    { to: "/admin/menu-view", label: "Ver carta", condition: !!activeRestaurantId && !canManageMenu(activeRestaurantId) && canViewMenu(activeRestaurantId) },
  ];

  const visibleNavItems = navItems.filter((item) => item.condition);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="font-display text-lg">
              Panel
            </Link>

            {/* Role badges */}
            <div className="flex items-center gap-1">
              {roleBadges}
            </div>

            {/* Restaurant switcher */}
            {showRestaurantSwitcher && (
              <Select
                value={activeRestaurantId ?? ""}
                onValueChange={(restaurantId) => {
                  // Navigate to same page with new restaurantId param
                  window.location.href = `/admin?restaurantId=${restaurantId}`;
                }}
              >
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Restaurante" />
                </SelectTrigger>
                <SelectContent>
                  {memberships.map((m: UserMembership) => (
                    <SelectItem key={m.restaurantId} value={m.restaurantId}>
                      {m.restaurantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <button
            onClick={() => signOut()}
            className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            Salir
          </button>
        </Container>
      </header>

      <Container className="flex flex-col gap-6 py-8 sm:flex-row">
        <aside className="sm:w-56 shrink-0">
          <nav className="flex flex-row gap-1 overflow-x-auto sm:flex-col">
            {visibleNavItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                search={{ restaurantId: activeRestaurantId }}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap",
                  pathname === n.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </Container>
    </div>
  );
}
