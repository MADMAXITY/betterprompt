import express, { type Request, type Response, type NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Supabase client (works with service role or anon key) if configured
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// OpenAI client for AI routes
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const RAW_TEMPERATURE = process.env.OPENAI_TEMPERATURE;
const OPENAI_TEMPERATURE = RAW_TEMPERATURE !== undefined && RAW_TEMPERATURE !== "" ? Number(RAW_TEMPERATURE) : undefined;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null as any;

async function aiJson(messages: Array<{ role: string; content: string }>) {
  if (!openai) throw new Error("OPENAI_API_KEY missing");
  const params: any = { model: OPENAI_MODEL, messages, response_format: { type: "json_object" } };
  if (typeof OPENAI_TEMPERATURE === "number" && Number.isFinite(OPENAI_TEMPERATURE)) params.temperature = OPENAI_TEMPERATURE;
  return openai.chat.completions.create(params);
}

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

// -------- AI endpoints (Vercel) --------
// Support both with and without /api prefix (Vercel may strip basepath)
const aiGeneratePaths = ["/api/ai/generate-prompt", "/ai/generate-prompt"] as const;
aiGeneratePaths.forEach((path) => app.post(path, async (req, res) => {
  try {
    const { goal, category, audience, tone, additionalContext } = (req.body || {}) as any;
    if (!goal) return res.status(400).json({ message: "goal is required" });
    const system = `You are an expert prompt engineer who creates high-quality prompts. Respond with JSON in this shape: {"title":"","description":"","content":"","suggestedCategory":""}`;
    const user = `Generate a reusable prompt for: "${goal}"\nCategory: ${category || 'Not specified'}\nAudience: ${audience || 'General'}\nTone: ${tone || 'Professional'}\nAdditional: ${additionalContext || 'None'}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: user }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    const data = JSON.parse(content);
    res.json({
      title: data.title || "Generated Prompt",
      description: data.description || "AI-generated prompt",
      content: data.content || "",
      suggestedCategory: data.suggestedCategory || "Writing",
    });
  } catch (e) {
    res.status(500).json({ message: (e as Error).message || "AI error" });
  }
}));

const aiRefinePaths = ["/api/ai/refine-prompt", "/ai/refine-prompt"] as const;
aiRefinePaths.forEach((path) => app.post(path, async (req, res) => {
  try {
    const { originalPrompt, refinementGoal } = (req.body || {}) as any;
    if (!originalPrompt || !refinementGoal) return res.status(400).json({ message: "originalPrompt and refinementGoal are required" });
    const system = `You improve prompts. Respond with JSON: {"refinedPrompt":"","improvements":["..."]}`;
    const user = `Original:\n${originalPrompt}\n\nGoal: ${refinementGoal}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: user }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    const data = JSON.parse(content);
    res.json({ refinedPrompt: data.refinedPrompt || originalPrompt, improvements: data.improvements || [] });
  } catch (e) {
    res.status(500).json({ message: (e as Error).message || "AI error" });
  }
}));

const aiSuggestPaths = ["/api/ai/suggest-improvements", "/ai/suggest-improvements"] as const;
aiSuggestPaths.forEach((path) => app.post(path, async (req, res) => {
  try {
    const { prompt } = (req.body || {}) as any;
    if (!prompt) return res.status(400).json({ message: "prompt is required" });
    const system = `You are an expert prompt engineer. Respond with JSON {"suggestions":["..."]}`;
    const user = `Analyze and suggest improvements for this prompt:\n\n${prompt}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: user }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    const data = JSON.parse(content);
    res.json({ suggestions: data.suggestions || [] });
  } catch (e) {
    res.status(500).json({ message: (e as Error).message || "AI error" });
  }
}));

const aiChatPaths = ["/api/ai/chat-prompt-builder", "/ai/chat-prompt-builder"] as const;
aiChatPaths.forEach((path) => app.post(path, async (req, res) => {
  try {
    const { messages = [] } = (req.body || {}) as any;
    const system = `You help users craft prompts via conversation. Respond as JSON. For ongoing: {"message":"","suggestions":["..."],"isComplete":false}. For final: {"message":"","isComplete":true,"finalPrompt":"","title":"","category":"","description":""}`;
    const resp = await aiJson([{ role: "system", content: system }, ...messages]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    const data = JSON.parse(content);
    res.json({
      message: data.message || "Let's craft your prompt. What's your goal?",
      suggestions: data.suggestions,
      isComplete: !!data.isComplete,
      finalPrompt: data.finalPrompt,
      title: data.title,
      category: data.category,
      description: data.description,
    });
  } catch (e) {
    res.status(500).json({ message: (e as Error).message || "AI error" });
  }
}));
