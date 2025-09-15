export const config = { runtime: "edge" };

import { ok, serverError } from "../_edge";
import { getSupabase, getUrl, seedsWithCategory } from "../_edge";

export default async function handler(req: Request) {
  try {
    const url = getUrl(req);
    const category = url.searchParams.get("category") || undefined;
    const featured = url.searchParams.get("featured") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const supabase = getSupabase();
    if (!supabase) return ok(seedsWithCategory({ category, featured, search }));

    let query = supabase.from("prompts").select("*, category:categories(*)");
    if (category) query = query.eq("category_id", category);
    if (featured === "true") query = query.eq("is_featured", true);
    if (search) {
      const q = `%${search}%`;
      query = query.or(`title.ilike.${q},description.ilike.${q},content.ilike.${q}`);
    }
    const { data, error } = await query;
    if (error) return ok(seedsWithCategory({ category, featured, search }));
    return ok(data || seedsWithCategory({ category, featured, search }));
  } catch (e: any) {
    try { console.error("/api/prompts error", e); } catch {}
    return serverError(e?.message || "prompts failed");
  }
}
