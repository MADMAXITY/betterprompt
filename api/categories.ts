import { createClient } from "@supabase/supabase-js";
import { seededCategories } from "../server/default-data";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.json(seededCategories);
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) return res.json(seededCategories);
      return res.json(data || []);
    } catch {
      return res.json(seededCategories);
    }
  } catch (e: any) {
    return res.json(seededCategories);
  }
}

