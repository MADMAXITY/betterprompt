export const config = { runtime: "edge" };

import { ok, notFound, serverError } from "../_edge";
import { getSupabase, getUrl } from "../_edge";
import { seededPrompts, seededCategories } from "../_seeds";

export default async function handler(req: Request) {
  try {
    const url = getUrl(req);
    const match = url.pathname.match(/\/api\/prompts\/([^/]+)$/);
    const id = match?.[1];
    if (!id) return notFound();

    const supabase = getSupabase();
    if (!supabase) {
      const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
      const p = seededPrompts.find((s) => s.id === id);
      if (!p) return notFound("Prompt not found");
      return ok({ ...p, category: catMap.get(p.categoryId)! });
    }

    const { data, error } = await supabase
      .from("prompts")
      .select("*, category:categories(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) return serverError(error.message);
    if (!data) return notFound("Prompt not found");
    return ok(data);
  } catch (e: any) {
    try { console.error("/api/prompts/[id] error", e); } catch {}
    return serverError(e?.message || "prompt by id failed");
  }
}
