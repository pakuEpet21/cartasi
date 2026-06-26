import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/features/auth";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Bienvenido</h1>
        <p className="text-sm text-muted-foreground">
          {user?.email ?? "Sesión activa"}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { to: "/admin/menu", title: "Platos", desc: "Crea, edita y publica los platos de la carta." },
          { to: "/admin/categories", title: "Categorías", desc: "Organiza la estructura del menú." },
          { to: "/admin/flags", title: "Feature flags", desc: "Activa o desactiva funcionalidades del sitio." },
          { to: "/admin/theme", title: "Tema visual", desc: "Cambia colores, tipografía y radios sin tocar código." },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="block rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elev)]"
          >
            <h2 className="font-display text-lg">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}