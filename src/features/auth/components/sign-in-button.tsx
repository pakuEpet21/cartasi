import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function GoogleSignInButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      // Save intended destination for post-OAuth redirect (only same-origin paths).
      if (redirectTo && redirectTo.startsWith("/")) {
        sessionStorage.setItem("post_auth_redirect", redirectTo);
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("No se pudo iniciar sesión con Google");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      // Popup path: session already set. Navigate.
      window.location.href = redirectTo ?? "/admin";
    } catch {
      toast.error("Error inesperado");
      setLoading(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={loading} size="lg" className="w-full">
      {loading ? "Redirigiendo…" : "Continuar con Google"}
    </Button>
  );
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}