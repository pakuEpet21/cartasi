import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { signOut } from "@/features/auth";
import { Container } from "@/shared/components/container";
import { cn } from "@/lib/utils";

const NAV: { to: string; label: string }[] = [
  { to: "/admin", label: "Inicio" },
  { to: "/admin/menu", label: "Platos" },
  { to: "/admin/categories", label: "Categorías" },
  { to: "/admin/flags", label: "Feature flags" },
  { to: "/admin/theme", label: "Tema visual" },
];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel — La Bella Tavola" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <Container className="flex h-14 items-center justify-between">
          <Link to="/admin" className="font-display text-lg">
            Panel
          </Link>
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
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
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