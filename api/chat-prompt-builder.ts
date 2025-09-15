export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, badRequest, serverError, readJsonBody } from "./_util";
import { aiJson, resolveOpenAIKey } from "./_util";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest(res, "Method not allowed");
  try {
    if (!resolveOpenAIKey()) return serverError(res, "OPENAI_API_KEY not configured");
    const body: any = (await readJsonBody(req)) || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
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
  } catch (e: any) {
    try { console.error("/api/chat-prompt-builder error", e); } catch {}
    return serverError(res, e?.message || "chat failed");
  }
}

