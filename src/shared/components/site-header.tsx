import { Link } from "@tanstack/react-router";
import { IfFlag } from "@/features/flags";
import { Container } from "./container";
import { useAuth } from "@/features/auth";

export function SiteHeader({ siteName }: { siteName: string }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link to="/" className="font-display text-xl tracking-tight">
          {siteName}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className="text-foreground/80 transition-colors hover:text-foreground">
            Carta
          </Link>
          <a
            href="#contacto"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            Contacto
          </a>
          <IfFlag name="cart">
            <button className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
              Carrito
            </button>
          </IfFlag>
          {user ? (
            <Link
              to="/admin"
              className="rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-wide text-foreground/80"
            >
              Admin
            </Link>
          ) : null}
        </nav>
      </Container>
    </header>
  );
}