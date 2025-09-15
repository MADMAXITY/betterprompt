export const config = { runtime: "edge" };

import { ok, serverError, getSupabase, getHealthInfo } from "./_edge";

export default async function handler(req: Request) {
  try {
    const { apiKeyPresent, model, supabaseConfigured } = getHealthInfo();
    let counts: any = { categories: 0, prompts: 0 };
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { count: catCount } = await supabase.from("categories").select("id", { count: "exact", head: true });
        const { count: pCount } = await supabase.from("prompts").select("id", { count: "exact", head: true });
        counts = { categories: catCount || 0, prompts: pCount || 0 };
      } catch {}
    }
    return ok({
      ok: true,
      env: {
        SUPABASE_URL: !!(globalThis as any).process?.env?.SUPABASE_URL || !!(globalThis as any).SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!(globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE_KEY || !!(globalThis as any).SUPABASE_SERVICE_ROLE_KEY,
        VITE_SUPABASE_ANON_KEY: !!(globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY || !!(globalThis as any).VITE_SUPABASE_ANON_KEY,
        VERCEL: !!(globalThis as any).process?.env?.VERCEL || !!(globalThis as any).VERCEL,
        OPENAI_KEY: apiKeyPresent,
        OPENAI_MODEL: model,
      },
      supabaseConfigured,
      counts,
    });
  } catch (e: any) {
    try { console.error("/api/health error", e); } catch {}
    return serverError(e?.message || "health failed");
  }
}
