import { createClient } from "@supabase/supabase-js";
import { seededPrompts } from "../../server/default-data";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const id = req.query?.id as string;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      const match = seededPrompts.find(p => p.id === id);
      return match ? res.json(match) : res.status(404).json({ message: "Prompt not found" });
    }
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await supabase.from("prompts").select("*, category:categories(*)").eq("id", id).maybeSingle();
      if (error) {
        const match = seededPrompts.find(p => p.id === id);
        return match ? res.json(match) : res.status(404).json({ message: "Prompt not found" });
      }
      if (!data) return res.status(404).json({ message: "Prompt not found" });
      return res.json(data);
    } catch {
      const match = seededPrompts.find(p => p.id === id);
      return match ? res.json(match) : res.status(404).json({ message: "Prompt not found" });
    }
  } catch (e: any) {
    const id = req.query?.id as string;
    const match = seededPrompts.find(p => p.id === id);
    return match ? res.json(match) : res.status(404).json({ message: "Prompt not found" });
  }
}
