import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GoogleSignInButton, useAuth } from "@/features/auth";
import { Container } from "@/shared/components/container";
import { SITE_NAME } from "@/shared/config";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Iniciar sesión — ${SITE_NAME}` },
      { name: "description", content: "Accede al panel de administración del restaurante." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    const intended = sessionStorage.getItem("post_auth_redirect");
    sessionStorage.removeItem("post_auth_redirect");
    navigate({ to: intended && intended.startsWith("/") ? (intended as never) : "/admin" });
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Container className="max-w-md">
        <div className="rounded-[calc(var(--radius)+4px)] border border-border bg-card p-8 shadow-[var(--shadow-elev)]">
          <h1 className="font-display text-2xl">Acceso al panel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión para gestionar la carta, promociones y configuración.
          </p>
          <div className="mt-6">
            <GoogleSignInButton redirectTo="/admin" />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Solo los miembros del restaurante pueden editar el contenido.
          </p>
        </div>
      </Container>
    </div>
  );
}