export const config = { runtime: "edge" };

import { ok, badRequest, serverError } from "./_edge";
import { aiJson, resolveOpenAIKey } from "./_edge";

export default async function handler(req: Request) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest("Method not allowed");
  try {
    if (!resolveOpenAIKey()) return serverError("OPENAI_API_KEY not configured");
    const body: any = await req.json().catch(() => ({}));
    const goal = body.goal as string | undefined;
    if (!goal) return badRequest("goal is required");
    const { category, audience, tone, additionalContext } = body;
    const system = `You are an expert prompt engineer who creates high-quality prompts. Respond with JSON in this shape: {"title":"","description":"","content":"","suggestedCategory":""}`;
    const userMsg = `Generate a reusable prompt for: "${goal}"\nCategory: ${category || 'Not specified'}\nAudience: ${audience || 'General'}\nTone: ${tone || 'Professional'}\nAdditional: ${additionalContext || 'None'}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: userMsg }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    return ok({
      title: data.title || "Generated Prompt",
      description: data.description || "AI-generated prompt",
      content: data.content || "",
      suggestedCategory: data.suggestedCategory || "Writing",
    });
  } catch (e: any) {
    try { console.error("/api/generate-prompt error", e); } catch {}
    return serverError(e?.message || "generate failed");
  }
}
