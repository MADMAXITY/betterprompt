import { createClient } from "@supabase/supabase-js";
import { seededPrompts } from "../server/default-data";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.json(seededPrompts);
    const { category, search, featured } = req.query as Record<string, string | undefined>;
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      let query = supabase.from("prompts").select("*, category:categories(*)");
      if (category) query = query.eq("category_id", category);
      if (featured === "true") query = query.eq("is_featured", true);
      if (search) {
        const q = `%${search}%`;
        query = query.or(`title.ilike.${q},description.ilike.${q},content.ilike.${q}`);
      }
      const { data, error } = await query;
      if (error) return res.json(seededPrompts);
      return res.json(data || []);
    } catch {
      return res.json(seededPrompts);
    }
  } catch (e: any) {
    return res.json(seededPrompts);
  }
}

