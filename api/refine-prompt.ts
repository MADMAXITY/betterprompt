export const config = { runtime: "edge" };

import { ok, badRequest, serverError } from "./_edge";
import { aiJson, resolveOpenAIKey } from "./_edge";

export default async function handler(req: Request) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest("Method not allowed");
  try {
    if (!resolveOpenAIKey()) return serverError("OPENAI_API_KEY not configured");
    const body: any = await req.json().catch(() => ({}));
    const originalPrompt = body.originalPrompt as string | undefined;
    const refinementGoal = body.refinementGoal as string | undefined;
    if (!originalPrompt || !refinementGoal) return badRequest("originalPrompt and refinementGoal are required");
    const system = `You improve prompts. Respond with JSON: {"refinedPrompt":"","improvements":["..."]}`;
    const userMsg = `Original:\n${originalPrompt}\n\nGoal: ${refinementGoal}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    return ok({ refinedPrompt: data.refinedPrompt || originalPrompt, improvements: data.improvements || [] });
  } catch (e: any) {
    try { console.error("/api/refine-prompt error", e); } catch {}
    return serverError(e?.message || "refine failed");
  }
}
