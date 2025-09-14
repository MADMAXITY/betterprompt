import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // In production, these should be present. In local dev, the app can still run without auth.
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars are missing; auth will be disabled in the client.");
}

export const supabase = url && anon ? createClient(url, anon) : undefined as any;

