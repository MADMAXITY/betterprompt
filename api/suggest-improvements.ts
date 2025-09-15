export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, badRequest, serverError, readJsonBody } from "./_util";
import { aiJson, resolveOpenAIKey } from "./_util";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest(res, "Method not allowed");
  try {
    if (!resolveOpenAIKey()) return serverError(res, "OPENAI_API_KEY not configured");
    const body: any = (await readJsonBody(req)) || {};
    const prompt = body.prompt as string | undefined;
    if (!prompt) return badRequest(res, "prompt is required");
    const system = `You are an expert prompt engineer. Respond with JSON {"suggestions":["..."]}`;
    const userMsg = `Analyze and suggest improvements for this prompt:\n\n${prompt}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    return ok(res, { suggestions: data.suggestions || [] });
  } catch (e: any) {
    try { console.error("/api/suggest-improvements error", e); } catch {}
    return serverError(res, e?.message || "suggest failed");
  }
}

