import { useState } from "react";
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Supabase redirects here after Google calls back Supabase.
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) {
        toast.error("No se pudo iniciar sesión con Google");
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
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