import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

async function getUserIdFromAuthHeader(req: any, supabase: any): Promise<string | null> {
  try {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    if (!auth || Array.isArray(auth)) return null;
    const token = (auth as string).startsWith("Bearer ") ? (auth as string).slice(7) : undefined;
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id as string;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  // If Supabase not configured, degrade gracefully
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    if (req.method === "GET") return res.json([]);
    if (req.method === "POST") return res.status(200).json({ message: "Saved (no-op: storage not configured)" });
    return res.status(405).send("Method Not Allowed");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (req.method === "GET") {
    const userId = await getUserIdFromAuthHeader(req, supabase);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { data, error } = await supabase
      .from("saved_prompts")
      .select("prompt:prompts(*, category:categories(*))")
      .eq("user_id", userId);
    if (error) return res.status(500).json({ message: error.message });
    const prompts = (data || []).map((row: any) => ({
      id: row.prompt.id,
      title: row.prompt.title,
      description: row.prompt.description,
      content: row.prompt.content,
      categoryId: row.prompt.category_id,
      isFeatured: !!row.prompt.is_featured,
      views: row.prompt.views ?? 0,
      likes: row.prompt.likes ?? 0,
      createdAt: row.prompt.created_at ? new Date(row.prompt.created_at) : new Date(),
      updatedAt: row.prompt.updated_at ? new Date(row.prompt.updated_at) : new Date(),
      category: row.prompt.category,
    }));
    return res.json(prompts);
  }

  if (req.method === "POST") {
    const userId = await getUserIdFromAuthHeader(req, supabase);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const promptId = (req.body?.promptId as string) || "";
    if (!promptId) return res.status(400).json({ message: "promptId is required" });
    const { count } = await supabase
      .from("saved_prompts")
      .select("id", { count: "exact", head: true })
      .match({ prompt_id: promptId, user_id: userId });
    if ((count ?? 0) > 0) {
      return res.status(200).json({ message: "Already saved" });
    }
    const { data, error } = await supabase
      .from("saved_prompts")
      .insert({ prompt_id: promptId, user_id: userId })
      .select("*")
      .single();
    if (error) return res.status(500).json({ message: error.message });
    return res.status(201).json({
      id: data.id,
      promptId: data.prompt_id,
      userId: data.user_id,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    });
  }

  return res.status(405).send("Method Not Allowed");
}

