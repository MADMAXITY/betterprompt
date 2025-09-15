// Edge runtime helpers for Vercel functions
export const config = { runtime: "edge" };

export type JSONValue = any;

export function json(body: JSONValue, init: ResponseInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export const ok = (body: JSONValue) => json(body, { status: 200 });
export const badRequest = (message = "Bad Request") => json({ message }, { status: 400 });
export const unauthorized = (message = "Unauthorized") => json({ message }, { status: 401 });
export const notFound = (message = "Not Found") => json({ message }, { status: 404 });
export const serverError = (message = "Internal Server Error") => json({ message }, { status: 500 });

export function getUrl(req: Request) {
  return new URL(req.url);
}

export function resolveStringEnv(name: string | undefined): string | undefined {
  if (!name) return undefined; const t = name.trim(); return t.length ? t : undefined;
}

export function resolveOpenAIKey(): string | undefined {
  const direct = resolveStringEnv((globalThis as any).process?.env?.OPENAI_API_KEY || (globalThis as any).OPENAI_API_KEY);
  if (direct) return direct;
  const alt = resolveStringEnv((globalThis as any).process?.env?.OPENAI_API_KEY_ENV_VAR || (globalThis as any).OPENAI_API_KEY_ENV_VAR);
  if (alt) {
    const viaEnv = (globalThis as any).process?.env?.[alt] || (globalThis as any)[alt];
    if (resolveStringEnv(viaEnv)) return viaEnv as string;
    if (alt.startsWith("sk-") || alt.startsWith("rk-") || alt.includes("proj-")) return alt;
  }
  const candidates = [
    (globalThis as any).process?.env?.VERCEL_OPENAI_API_KEY,
    (globalThis as any).process?.env?.OPENAI_KEY,
    (globalThis as any).process?.env?.AI_API_KEY,
    (globalThis as any).process?.env?.NEXT_PUBLIC_OPENAI_API_KEY,
    (globalThis as any).process?.env?.VITE_OPENAI_API_KEY,
  ];
  for (const c of candidates) { const v = resolveStringEnv(c); if (v) return v; }
  return undefined;
}

export async function aiJson(messages: Array<{ role: string; content: string }>) {
  const apiKey = resolveOpenAIKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  const model = resolveStringEnv((globalThis as any).process?.env?.OPENAI_MODEL || (globalThis as any).OPENAI_MODEL) || "gpt-4o-mini";
  const rawTemp = resolveStringEnv((globalThis as any).process?.env?.OPENAI_TEMPERATURE || (globalThis as any).OPENAI_TEMPERATURE);
  const temperature = rawTemp !== undefined ? Number(rawTemp) : undefined;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" }, ...(Number.isFinite(temperature) ? { temperature } : {}) }),
  });
  if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
  return resp.json();
}

// Supabase Edge client
import { createClient } from "@supabase/supabase-js";
export function getSupabase() {
  try {
    const url = resolveStringEnv((globalThis as any).process?.env?.SUPABASE_URL || (globalThis as any).SUPABASE_URL);
    const key = resolveStringEnv((globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE_KEY || (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY || (globalThis as any).SUPABASE_SERVICE_ROLE_KEY || (globalThis as any).VITE_SUPABASE_ANON_KEY);
    if (!url || !key) return null;
    return createClient(url, key);
  } catch {
    return null;
  }
}

// Seeds
import { seededCategories, seededPrompts } from "./_seeds";
export function seedsWithCategory(options?: { category?: string; featured?: string; search?: string; }) {
  const { category, featured, search } = options || {};
  const catMap = new Map(seededCategories.map((c) => [c.id, c] as const));
  let list = seededPrompts;
  if (category) list = list.filter((p) => p.categoryId === category);
  if (featured === "true") list = list.filter((p) => !!p.isFeatured);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.content.toLowerCase().includes(q),
    );
  }
  return list.map((p) => ({ ...p, category: catMap.get(p.categoryId)! }));
}

export function getHealthInfo() {
  const apiKey = resolveOpenAIKey();
  const model = resolveStringEnv((globalThis as any).process?.env?.OPENAI_MODEL || (globalThis as any).OPENAI_MODEL) || "gpt-4o-mini";
  const supabaseConfigured = !!(resolveStringEnv((globalThis as any).process?.env?.SUPABASE_URL || (globalThis as any).SUPABASE_URL) && resolveStringEnv((globalThis as any).process?.env?.SUPABASE_SERVICE_ROLE_KEY || (globalThis as any).process?.env?.VITE_SUPABASE_ANON_KEY || (globalThis as any).SUPABASE_SERVICE_ROLE_KEY || (globalThis as any).VITE_SUPABASE_ANON_KEY));
  return { apiKeyPresent: !!apiKey, model, supabaseConfigured } as const;
}

// Normalize Supabase prompt rows to UI shape expected by the client
export function normalizeDbPrompts(rows: any[] | null | undefined) {
  if (!Array.isArray(rows)) return [] as any[];
  return rows.map((r) => ({
    ...r,
    // ensure camelCase field used by the UI exists
    categoryId: r.categoryId ?? r.category_id,
    isFeatured: typeof r.isFeatured !== "undefined" ? r.isFeatured : !!r.is_featured,
  }));
}
