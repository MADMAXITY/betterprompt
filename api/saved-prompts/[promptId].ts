import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  if (req.method !== "DELETE") return res.status(405).send("Method Not Allowed");
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const promptId = req.query?.promptId as string;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({ message: "Prompt unsaved (no-op: storage not configured)" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = userData.user.id as string;
    await supabase.from("saved_prompts").delete().match({ prompt_id: promptId, user_id: userId });
    return res.json({ message: "Prompt unsaved successfully" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to unsave prompt" });
  }
}
