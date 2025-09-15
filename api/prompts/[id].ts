export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, notFound, serverError, getSupabase, getUrl } from "../_util";
import { seededPrompts, seededCategories } from "../_seeds";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = getUrl(req);
    const match = url.pathname.match(/\/api\/prompts\/([^/]+)$/);
    const id = match?.[1];
    if (!id) return notFound(res);

    const supabase = await getSupabase();
    if (!supabase) {
      const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
      const p = seededPrompts.find((s) => s.id === id);
      if (!p) return notFound(res, "Prompt not found");
      return ok(res, { ...p, category: catMap.get(p.categoryId)! });
    }

    const { data, error } = await supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) return serverError(res, error.message);
    if (!data) return notFound(res, "Prompt not found");
    return ok(res, data);
  } catch (e: any) {
    try { console.error("/api/prompts/[id] error", e); } catch {}
    return serverError(res, e?.message || "prompt by id failed");
  }
}
