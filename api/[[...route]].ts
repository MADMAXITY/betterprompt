// Explicitly pin to a Node runtime supported by Vercel
export const config = { runtime: "nodejs20.x" };

import { createClient } from "@supabase/supabase-js";
import { aiJson, readJsonBody, getOpenAIConfig } from "./_env";
import { seededCategories, seededPrompts } from "../server/default-data";


function json(res: any, status: number, body: any) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function ok(res: any, body: any) { json(res, 200, body); }
function badRequest(res: any, message: string) { json(res, 400, { message }); }
function unauthorized(res: any, message = "Unauthorized") { json(res, 401, { message }); }
function notFound(res: any, message = "Not Found") { json(res, 404, { message }); }
function serverError(res: any, message = "Internal Server Error") { json(res, 500, { message }); }

function getUrl(req: any) {
  // Base is irrelevant; only pathname/query used
  return new URL(req.url || "/", "http://localhost");
}

function getSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}



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
  try {
    const url = getUrl(req);
    const path = url.pathname || "/";
    const method = (req.method || "GET").toUpperCase();

    // HEALTH
    if (method === "GET" && path === "/api/health") {
      const { apiKey, model } = getOpenAIConfig();
      const supabaseConfigured = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY));
      let counts: any = { categories: 0, prompts: 0 };
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { count: catCount } = await supabase.from("categories").select("id", { count: "exact", head: true });
          const { count: pCount } = await supabase.from("prompts").select("id", { count: "exact", head: true });
          counts = { categories: catCount || 0, prompts: pCount || 0 };
        } catch {}
      }
      return ok(res, {
        ok: true,
        env: {
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
          VERCEL: !!process.env.VERCEL,
          OPENAI_KEY: !!apiKey,
          OPENAI_MODEL: model,
        },
        supabaseConfigured,
        counts,
      });
    }

    // CATEGORIES (with graceful fallback to seeds)
    if (method === "GET" && path === "/api/categories") {
      const supabase = getSupabase();
      if (!supabase) return ok(res, seededCategories);
      try {
        const { data, error } = await supabase.from("categories").select("*").order("name");
        if (error) return ok(res, seededCategories);
        return ok(res, data || seededCategories);
      } catch {
        return ok(res, seededCategories);
      }
    }

    // PROMPTS LIST (with graceful fallback to seeds)
    if (method === "GET" && path === "/api/prompts") {
      const supabase = getSupabase();
      const category = url.searchParams.get("category") || undefined;
      const featured = url.searchParams.get("featured") || undefined;
      const search = url.searchParams.get("search") || undefined;

      // Helper to transform seeds → PromptWithCategory[]
      const seedsWithCategory = () => {
        const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
        let list = seededPrompts;
        if (category) list = list.filter((p) => p.categoryId === category);
        if (featured === "true") list = list.filter((p) => !!p.isFeatured);
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.content.toLowerCase().includes(q)
          );
        }
        return list.map((p) => ({ ...p, category: catMap.get(p.categoryId)! }));
      };

      if (!supabase) return ok(res, seedsWithCategory());
      try {
        let query = supabase.from("prompts").select("*, category:categories(*)");
        if (category) query = query.eq("category_id", category);
        if (featured === "true") query = query.eq("is_featured", true);
        if (search) {
          const q = `%${search}%`;
          query = query.or(`title.ilike.${q},description.ilike.${q},content.ilike.${q}`);
        }
        const { data, error } = await query;
        if (error) return ok(res, seedsWithCategory());
        return ok(res, data || seedsWithCategory());
      } catch {
        return ok(res, seedsWithCategory());
      }
    }

    // PROMPT BY ID (with graceful fallback to seeds)
    const promptById = path.match(/^\/api\/prompts\/([^\/]+)$/);
    if (method === "GET" && promptById) {
      const id = promptById[1];
      const supabase = getSupabase();
      if (!supabase) {
        const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
        const p = seededPrompts.find((s) => s.id === id);
        if (!p) return notFound(res, "Prompt not found");
        return ok(res, { ...p, category: catMap.get(p.categoryId)! });
      }
      try {
        const { data, error } = await supabase
          .from("prompts")
          .select("*, category:categories(*)")
          .eq("id", id)
          .maybeSingle();
        if (error) {
          const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
          const p = seededPrompts.find((s) => s.id === id);
          if (!p) return serverError(res, `Database error: ${error.message}`);
          return ok(res, { ...p, category: catMap.get(p.categoryId)! });
        }
        if (!data) return notFound(res, "Prompt not found");
        return ok(res, data);
      } catch {
        const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
        const p = seededPrompts.find((s) => s.id === id);
        if (!p) return serverError(res, "Database exception");
        return ok(res, { ...p, category: catMap.get(p.categoryId)! });
      }
    }

    // PROMPT VIEWS INCREMENT (no-op for serverless)
    const promptViews = path.match(/^\/api\/prompts\/([^\/]+)\/views$/);
    if (method === "POST" && promptViews) {
      return ok(res, { message: "ok" });
    }

    // SAVED PROMPTS
    if (path === "/api/saved-prompts") {
      const supabase = getSupabase();
      if (!supabase) {
        if (method === "GET") return ok(res, []);
        if (method === "POST") return ok(res, { message: "Saved (no-op: storage not configured)" });
      }
      if (!supabase) return badRequest(res, "Storage not configured");
      if (method === "GET") {
        const userId = await getUserIdFromAuthHeader(req, supabase);
        if (!userId) return unauthorized(res);
        const { data, error } = await supabase
          .from("saved_prompts")
          .select("prompt:prompts(*, category:categories(*))")
          .eq("user_id", userId);
        if (error) return serverError(res, error.message);
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
        return ok(res, prompts);
      }
      if (method === "POST") {
        const userId = await getUserIdFromAuthHeader(req, supabase);
        if (!userId) return unauthorized(res);
        const body = (await readJsonBody(req)) || req.body || {};
        const promptId = (body?.promptId as string) || "";
        if (!promptId) return badRequest(res, "promptId is required");
        const { count } = await supabase
          .from("saved_prompts")
          .select("id", { count: "exact", head: true })
          .match({ prompt_id: promptId, user_id: userId });
        if ((count ?? 0) > 0) return ok(res, { message: "Already saved" });
        const { data, error } = await supabase
          .from("saved_prompts")
          .insert({ prompt_id: promptId, user_id: userId })
          .select("*")
          .single();
        if (error) return serverError(res, error.message);
        return json(res, 201, {
          id: data.id,
          promptId: data.prompt_id,
          userId: data.user_id,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        });
      }
      return json(res, 405, { message: "Method Not Allowed" });
    }

    const savedDelete = path.match(/^\/api\/saved-prompts\/([^\/]+)$/);
    if (savedDelete && method === "DELETE") {
      const supabase = getSupabase();
      const promptId = savedDelete[1];
      if (!supabase) return ok(res, { message: "Prompt unsaved (no-op: storage not configured)" });
      const userId = await getUserIdFromAuthHeader(req, supabase);
      if (!userId) return unauthorized(res);
      await supabase.from("saved_prompts").delete().match({ prompt_id: promptId, user_id: userId });
      return ok(res, { message: "Prompt unsaved successfully" });
    }

    // AI ROUTES (support both /api/* and /api/ai/*)
    const aiPaths = new Set([
      "/api/generate-prompt",
      "/api/ai/generate-prompt",
      "/api/refine-prompt",
      "/api/ai/refine-prompt",
      "/api/suggest-improvements",
      "/api/ai/suggest-improvements",
      "/api/chat-prompt-builder",
      "/api/ai/chat-prompt-builder",
    ]);

    if (method === "POST" && aiPaths.has(path)) {
      const { apiKey } = getOpenAIConfig();
      if (!apiKey) return json(res, 503, { message: "OPENAI_API_KEY not configured" });
      const body = (await readJsonBody(req)) || req.body || {};

      if (path.endsWith("generate-prompt")) {
        const { goal, category, audience, tone, additionalContext } = body as any;
        if (!goal) return badRequest(res, "goal is required");
        const system = `You are an expert prompt engineer who creates high-quality prompts. Respond with JSON in this shape: {"title":"","description":"","content":"","suggestedCategory":""}`;
        const userMsg = `Generate a reusable prompt for: "${goal}"\nCategory: ${category || 'Not specified'}\nAudience: ${audience || 'General'}\nTone: ${tone || 'Professional'}\nAdditional: ${additionalContext || 'None'}`;
        const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
        const content = resp.choices?.[0]?.message?.content ?? "{}";
        let data: any = {};
        try { data = JSON.parse(content); } catch { data = {}; }
        return ok(res, {
          title: data.title || "Generated Prompt",
          description: data.description || "AI-generated prompt",
          content: data.content || "",
          suggestedCategory: data.suggestedCategory || "Writing",
        });
      }

      if (path.endsWith("refine-prompt")) {
        const { originalPrompt, refinementGoal } = body as any;
        if (!originalPrompt || !refinementGoal) return badRequest(res, "originalPrompt and refinementGoal are required");
        const system = `You improve prompts. Respond with JSON: {"refinedPrompt":"","improvements":["..."]}`;
        const userMsg = `Original:\n${originalPrompt}\n\nGoal: ${refinementGoal}`;
        const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
        const content = resp.choices?.[0]?.message?.content ?? "{}";
        let data: any = {};
        try { data = JSON.parse(content); } catch { data = {}; }
        return ok(res, { refinedPrompt: data.refinedPrompt || originalPrompt, improvements: data.improvements || [] });
      }

      if (path.endsWith("suggest-improvements")) {
        const { prompt } = body as any;
        if (!prompt) return badRequest(res, "prompt is required");
        const system = `You are an expert prompt engineer. Respond with JSON {"suggestions":["..."]}`;
        const userMsg = `Analyze and suggest improvements for this prompt:\n\n${prompt}`;
        const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
        const content = resp.choices?.[0]?.message?.content ?? "{}";
        let data: any = {};
        try { data = JSON.parse(content); } catch { data = {}; }
        return ok(res, { suggestions: data.suggestions || [] });
      }

      if (path.endsWith("chat-prompt-builder")) {
        const { messages = [] } = body as any;
        const system = `You help users craft prompts via conversation. Respond as JSON. For ongoing: {"message":"","suggestions":["..."],"isComplete":false}. For final: {"message":"","isComplete":true,"finalPrompt":"","title":"","category":"","description":""}`;
        const resp = await aiJson([{ role: "system", content: system }, ...messages]);
        const content = resp.choices?.[0]?.message?.content ?? "{}";
        let data: any = {};
        try { data = JSON.parse(content); } catch { data = {}; }
        return ok(res, {
          message: data.message || "Let's craft your prompt. What's your goal?",
          suggestions: data.suggestions,
          isComplete: !!data.isComplete,
          finalPrompt: data.finalPrompt,
          title: data.title,
          category: data.category,
          description: data.description,
        });
      }
    }

    // Fallback 404 for unknown API routes
    if (path.startsWith("/api/")) {
      return notFound(res);
    }

    // Non-API should not hit this function
    return notFound(res);
  } catch (e: any) {
    return serverError(res, e?.message || "Function error");
  }
}
