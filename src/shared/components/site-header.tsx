import { Link } from "@tanstack/react-router";
import { IfFlag } from "@/features/flags";
import { Container } from "./container";
import { useAuth } from "@/features/auth";
import { CartTrigger } from "@/features/cart";
import { LanguageToggle, useT } from "@/features/i18n";
import { QrMenuButton } from "./qr-menu-button";

export function SiteHeader({ siteName }: { siteName: string }) {
  const { user } = useAuth();
  const t = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="font-display text-xl tracking-tight">
          {siteName}
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <a href="#contacto" className="hidden text-foreground/80 transition-colors hover:text-foreground sm:inline">
            {t("contact")}
          </a>
          <IfFlag name="multiLanguage">
            <LanguageToggle />
          </IfFlag>
          <IfFlag name="qrMenu">
            <QrMenuButton />
          </IfFlag>
          <IfFlag name="cart">
            <CartTrigger />
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