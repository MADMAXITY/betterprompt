export const config = { runtime: "edge" };

import { ok, badRequest, serverError } from "./_edge";
import { aiJson, resolveOpenAIKey } from "./_edge";

export default async function handler(req: Request) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest("Method not allowed");
  try {
    if (!resolveOpenAIKey()) return serverError("OPENAI_API_KEY not configured");
    const body: any = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = `You help users craft prompts via conversation. Respond as JSON. For ongoing: {"message":"","suggestions":["..."],"isComplete":false}. For final: {"message":"","isComplete":true,"finalPrompt":"","title":"","category":"","description":""}`;
    const resp = await aiJson([{ role: "system", content: system }, ...messages]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    return ok({
      message: data.message || "Let's craft your prompt. What's your goal?",
      suggestions: data.suggestions,
      isComplete: !!data.isComplete,
      finalPrompt: data.finalPrompt,
      title: data.title,
      category: data.category,
      description: data.description,
    });
  } catch (e: any) {
    try { console.error("/api/chat-prompt-builder error", e); } catch {}
    return serverError(e?.message || "chat failed");
  }
}
