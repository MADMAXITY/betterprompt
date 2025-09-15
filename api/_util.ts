// Shared utilities for Node serverless API routes

import type { IncomingMessage, ServerResponse } from "http";
import { seededCategories, seededPrompts, type Category, type Prompt } from "./_seeds";

export function getUrl(req: IncomingMessage) {
  return new URL(req.url || "/", "http://localhost");
}

export function json(res: ServerResponse, status: number, body: any) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}
export const ok = (res: ServerResponse, body: any) => json(res, 200, body);
export const badRequest = (res: ServerResponse, message: string) => json(res, 400, { message });
export const unauthorized = (res: ServerResponse, message = "Unauthorized") => json(res, 401, { message });
export const notFound = (res: ServerResponse, message = "Not Found") => json(res, 404, { message });
export const serverError = (res: ServerResponse, message = "Internal Server Error") => json(res, 500, { message });

export async function readJsonBody<T = any>(req: IncomingMessage): Promise<T | undefined> {
  try {
    const r = req as any;
    if (r.body && typeof r.body === "object") return r.body as T;
    if (typeof r.body === "string") {
      try { return JSON.parse(r.body) as T; } catch { /* noop */ }
    }
  } catch { /* noop */ }

  const chunks: Buffer[] = [];
  const body: string = await new Promise((resolve, reject) => {
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
  if (!body) return undefined;
  try { return JSON.parse(body) as T; } catch { return undefined; }
}

export async function getSupabaseAsync() {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch {
    return null;
  }
}

// Backward-compatible name; kept for call sites but switches to async on demand
export function getSupabase() {
  // Lazy wrapper that returns a thenable; existing code using await still works.
  return (getSupabaseAsync() as any);
}

export async function getUserIdFromAuthHeader(req: IncomingMessage, supabase: any): Promise<string | null> {
  try {
    const headers: any = (req as any).headers || {};
    const auth = headers["authorization"] || headers["Authorization"]; 
    if (!auth || Array.isArray(auth)) return null;
    const token = (auth as string).startsWith("Bearer ") ? (auth as string).slice(7) : undefined;
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id as string;
  } catch { return null; }
}

export function seedsWithCategory(options?: { category?: string; featured?: string; search?: string; }) {
  const { category, featured, search } = options || {};
  const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
  let list: Prompt[] = seededPrompts;
  if (category) list = list.filter((p) => p.categoryId === category);
  if (featured === "true") list = list.filter((p) => !!p.isFeatured);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
    );
  }
  return list.map((p) => ({ ...p, category: catMap.get(p.categoryId)! }));
}

export function getHealthInfo() {
  const apiKey = resolveOpenAIKey();
  const model = resolveStringEnv(process.env.OPENAI_MODEL) || "gpt-4o-mini";
  const supabaseConfigured = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY));
  return { apiKeyPresent: !!apiKey, model, supabaseConfigured } as const;
}

// Env helpers + OpenAI key resolution without importing the SDK
function resolveStringEnv(name: string | undefined): string | undefined {
  if (!name) return undefined; const t = name.trim(); return t.length ? t : undefined;
}
export function resolveOpenAIKey(): string | undefined {
  const direct = resolveStringEnv(process.env.OPENAI_API_KEY); if (direct) return direct;
  const alt = resolveStringEnv(process.env.OPENAI_API_KEY_ENV_VAR);
  if (alt) {
    const viaEnv = (process.env as any)[alt];
    if (resolveStringEnv(viaEnv)) return viaEnv as string;
    if (alt.startsWith("sk-") || alt.startsWith("rk-") || alt.includes("proj-")) return alt;
  }
  const fallbacks = [process.env.VERCEL_OPENAI_API_KEY, process.env.OPENAI_KEY, process.env.AI_API_KEY, process.env.NEXT_PUBLIC_OPENAI_API_KEY, process.env.VITE_OPENAI_API_KEY];
  for (const c of fallbacks) { const v = resolveStringEnv(c); if (v) return v; }
  return undefined;
}

// Minimal AI client that lazy-loads the OpenAI SDK only when needed
export async function aiJson(messages: Array<{ role: string; content: string }>) {
  const apiKey = resolveOpenAIKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  const { default: OpenAI } = await import("openai");
  const model = resolveStringEnv(process.env.OPENAI_MODEL) || "gpt-4o-mini";
  const rawTemp = resolveStringEnv(process.env.OPENAI_TEMPERATURE);
  const temperature = rawTemp !== undefined ? Number(rawTemp) : undefined;
  const client = new OpenAI({ apiKey });
  const params: any = { model, messages, response_format: { type: "json_object" } };
  if (typeof temperature === "number" && Number.isFinite(temperature)) params.temperature = temperature;
  return client.chat.completions.create(params);
}
