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
        // Exchange OAuth code for session (PKCE)
        await supabase.auth.exchangeCodeForSession(window.location.href);
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

