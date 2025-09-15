import { getOpenAIConfig } from "./_env";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  try {
    const { apiKey, model } = getOpenAIConfig();
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Probe Supabase counts only if configured
    let counts: any = { categories: 0, prompts: 0 };
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { count: catCount } = await supabase.from("categories").select("id", { count: "exact", head: true });
        const { count: pCount } = await supabase.from("prompts").select("id", { count: "exact", head: true });
        counts = { categories: catCount || 0, prompts: pCount || 0 };
      } catch {
        // ignore supabase errors in health; keep defaults
      }
    }

    res.json({
      ok: true,
      env: {
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        VERCEL: !!process.env.VERCEL,
        OPENAI_KEY: !!apiKey,
        OPENAI_MODEL: model,
      },
      counts,
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
}
