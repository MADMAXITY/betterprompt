export const config = { runtime: "edge" };

import { ok } from "./_edge";
import { getSupabase } from "./_edge";
import { seededCategories } from "./_seeds";

export default async function handler(_req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return ok(seededCategories);
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) return ok(seededCategories);
    return ok(data || seededCategories);
  } catch (e: any) {
    try { console.error("/api/categories error", e); } catch {}
    return ok(seededCategories);
  }
}
