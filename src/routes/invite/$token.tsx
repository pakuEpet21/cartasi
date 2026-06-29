/**
 * Super Admin Restaurant Management — Public invite acceptance page
 * PR 3: Admin UI
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { getInvitationByToken } from "@/features/restaurants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [{ title: "Invitación — CartaSI" }],
  }),
  ssr: false,
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, isError, error } = useInvitation(token);

  if (!authLoading && user && data?.invitation) {
    if (data.invitation.email.toLowerCase() === user.email?.toLowerCase()) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-sm w-full rounded-lg border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] space-y-4">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="font-display text-xl">Ya tienes acceso</h1>
            <p className="text-sm text-muted-foreground">
              Tu cuenta ya está asociada a este restaurante. Puedes empezar a usarlo.
            </p>
            <Button asChild className="w-full">
              <Link to="/admin">Ir al panel</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-4">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-lg border border-destructive/50 bg-card p-8 text-center shadow-[var(--shadow-soft)] space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">✕</span>
          </div>
          <h1 className="font-display text-xl">Invitación no válida</h1>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Esta invitación no existe o ya fue usada."}
          </p>
          <Button variant="outline" asChild>
            <Link to="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!data?.invitation) return null;

  const { invitation } = data;

  if (invitation.accepted_at) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-lg border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] space-y-4">
          <h1 className="font-display text-xl">Invitación ya usada</h1>
          <p className="text-sm text-muted-foreground">
            Esta invitación ya fue aceptada. Inicia sesión para acceder.
          </p>
          <Button asChild>
            <Link to="/auth">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  const inviteUrl = `${window.location.origin}/invite/${token}`;

  function handleSignIn() {
    sessionStorage.setItem("post_auth_redirect", inviteUrl);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-sm w-full rounded-lg border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-2xl">Has sido invitado</h1>
          <p className="text-sm text-muted-foreground">
            Te han invitado a unirte a un restaurante en CartaSI.
          </p>
        </div>

        <div className="rounded-md bg-muted p-4 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{invitation.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Rol</span>
            <Badge variant="outline">{invitation.role}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Inicia sesión con tu cuenta de Google para aceptar la invitación. Si aún no tienes cuenta, se creará automáticamente.
          </p>
          <Button asChild className="w-full" onClick={handleSignIn}>
            <Link to="/auth">Iniciar sesión con Google</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function useInvitation(token: string) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitationByToken({ data: { token } }),
    enabled: !!token,
  });
}