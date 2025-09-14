import express, { type Request, type Response, type NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Supabase client (works with service role or anon key) if configured
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Middleware to require Supabase auth for certain routes
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!supabase) return res.status(500).json({ message: "Auth not configured" });
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    if (!auth || Array.isArray(auth)) return res.status(401).json({ message: "Unauthorized" });
    const token = (auth as string).startsWith("Bearer ") ? (auth as string).slice(7) : undefined;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ message: "Invalid token" });
    (req as any).userId = data.user.id;
    next();
  } catch (e) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Health
app.get("/api/health", async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({
        ok: true,
        env: {
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
          VERCEL: !!process.env.VERCEL,
        },
        counts: { categories: 0, prompts: 0 },
      });
    }

    const { count: catCount, error: catErr } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });
    const { count: pCount, error: pErr } = await supabase
      .from("prompts")
      .select("id", { count: "exact", head: true });
    res.json({
      ok: true,
      env: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        VERCEL: !!process.env.VERCEL,
      },
      counts: { categories: catErr ? 0 : catCount || 0, prompts: pErr ? 0 : pCount || 0 },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

// Categories
app.get("/api/categories", async (_req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

// Helpers
function mapRowToPrompt(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    categoryId: row.category_id,
    isFeatured: !!row.is_featured,
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    category: row.category,
  };
}

// Prompts list and filters
app.get("/api/prompts", async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { category, search, featured } = req.query as Record<string, string | undefined>;
    let query = supabase.from("prompts").select("*, category:categories(*)");

    if (category) query = query.eq("category_id", category);
    if (featured === "true") query = query.eq("is_featured", true);
    if (search) {
      const q = `%${search}%`;
      query = query.or(`title.ilike.${q},description.ilike.${q},content.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    const mapped = (data || []).map(mapRowToPrompt);
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ message: (e as Error).message });
  }
});

// Prompt by id
app.get("/api/prompts/:id", async (req, res) => {
  if (!supabase) return res.status(404).json({ message: "Prompt not found" });
  const { data, error } = await supabase
    .from("prompts")
    .select("*, category:categories(*)")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: "Prompt not found" });
  res.json(mapRowToPrompt(data));
});

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}

// Saved prompts endpoints (require auth)
app.get("/api/saved-prompts", requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const userId = (req as any).userId as string;
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
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch saved prompts" });
  }
});

app.post("/api/saved-prompts", requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ message: "Auth not configured" });
    const userId = (req as any).userId as string;
    const promptId = (req.body?.promptId as string) || "";
    if (!promptId) return res.status(400).json({ message: "promptId is required" });
    // Prevent duplicates
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
    res.status(201).json({
      id: data.id,
      promptId: data.prompt_id,
      userId: data.user_id,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save prompt" });
  }
});

app.delete("/api/saved-prompts/:promptId", requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ message: "Auth not configured" });
    const userId = (req as any).userId as string;
    const promptId = req.params.promptId;
    await supabase
      .from("saved_prompts")
      .delete()
      .match({ prompt_id: promptId, user_id: userId });
    res.json({ message: "Prompt unsaved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsave prompt" });
  }
});
