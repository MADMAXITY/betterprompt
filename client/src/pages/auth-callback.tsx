import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!supabase) return navigate("/library");
        const url = window.location.href;
        if (url.includes("#access_token=") || url.includes("#id_token=")) {
          // Implicit hash flow: trigger session bootstrap
          await supabase.auth.getSession();
        } else if (url.includes("code=")) {
          // PKCE code flow
          await supabase.auth.exchangeCodeForSession(url);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) navigate("/library");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-muted-foreground text-sm">
        <i className="fas fa-spinner fa-spin mr-2" />
        Completing sign-in…
      </div>
    </div>
  );
}
