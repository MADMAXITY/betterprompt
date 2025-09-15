export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, serverError, getSupabase } from "./_util";
import { seededCategories } from "./_seeds";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  try {
    const supabase = await getSupabase();
    if (!supabase) return ok(res, seededCategories);
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) return ok(res, seededCategories);
    return ok(res, data || seededCategories);
  } catch (e: any) {
    try { console.error("/api/categories error", e); } catch {}
    return ok(res, seededCategories);
  }
}
