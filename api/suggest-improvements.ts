export const config = { runtime: "edge" };

import { ok, badRequest, serverError } from "./_edge";
import { aiJson, resolveOpenAIKey } from "./_edge";

export default async function handler(req: Request) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest("Method not allowed");
  try {
    if (!resolveOpenAIKey()) return serverError("OPENAI_API_KEY not configured");
    const body: any = await req.json().catch(() => ({}));
    const prompt = body.prompt as string | undefined;
    if (!prompt) return badRequest("prompt is required");
    const system = `You are an expert prompt engineer. Respond with JSON {"suggestions":["..."]}`;
    const userMsg = `Analyze and suggest improvements for this prompt:\n\n${prompt}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    return ok({ suggestions: data.suggestions || [] });
  } catch (e: any) {
    try { console.error("/api/suggest-improvements error", e); } catch {}
    return serverError(e?.message || "suggest failed");
  }
}
