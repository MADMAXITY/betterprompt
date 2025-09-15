export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, serverError, getSupabase, getHealthInfo } from "./_util";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { apiKeyPresent, model, supabaseConfigured } = getHealthInfo();
    let counts: any = { categories: 0, prompts: 0 };
    const supabase = await getSupabase();
    if (supabase) {
      try {
        const { count: catCount } = await supabase.from("categories").select("id", { count: "exact", head: true });
        const { count: pCount } = await supabase.from("prompts").select("id", { count: "exact", head: true });
        counts = { categories: catCount || 0, prompts: pCount || 0 };
      } catch {}
    }
    return ok(res, {
      ok: true,
      env: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        VERCEL: !!process.env.VERCEL,
        OPENAI_KEY: apiKeyPresent,
        OPENAI_MODEL: model,
      },
      supabaseConfigured,
      counts,
    });
  } catch (e: any) {
    try { console.error("/api/health error", e); } catch {}
    return serverError(res, e?.message || "health failed");
  }
}
