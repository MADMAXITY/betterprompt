export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, badRequest, serverError, readJsonBody } from "./_util";
import { aiJson, resolveOpenAIKey } from "./_util";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest(res, "Method not allowed");
  try {
    if (!resolveOpenAIKey()) return serverError(res, "OPENAI_API_KEY not configured");
    const body: any = (await readJsonBody(req)) || {};
    const originalPrompt = body.originalPrompt as string | undefined;
    const refinementGoal = body.refinementGoal as string | undefined;
    if (!originalPrompt || !refinementGoal) return badRequest(res, "originalPrompt and refinementGoal are required");
    const system = `You improve prompts. Respond with JSON: {"refinedPrompt":"","improvements":["..."]}`;
    const userMsg = `Original:\n${originalPrompt}\n\nGoal: ${refinementGoal}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    return ok(res, { refinedPrompt: data.refinedPrompt || originalPrompt, improvements: data.improvements || [] });
  } catch (e: any) {
    try { console.error("/api/refine-prompt error", e); } catch {}
    return serverError(res, e?.message || "refine failed");
  }
}

