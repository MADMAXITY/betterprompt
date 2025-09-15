export const config = { runtime: "nodejs" };

import { aiJson, readJsonBody, getOpenAIConfig } from "../_env";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const { apiKey } = getOpenAIConfig();
    if (!apiKey) return res.status(503).json({ message: "OPENAI_API_KEY not configured" });
    const body = (await readJsonBody(req)) || (req.body || {});
    const { goal, category, audience, tone, additionalContext } = (body || {}) as any;
    if (!goal) return res.status(400).json({ message: "goal is required" });
    const system = `You are an expert prompt engineer who creates high-quality prompts. Respond with JSON in this shape: {"title":"","description":"","content":"","suggestedCategory":""}`;
    const user = `Generate a reusable prompt for: "${goal}"\nCategory: ${category || 'Not specified'}\nAudience: ${audience || 'General'}\nTone: ${tone || 'Professional'}\nAdditional: ${additionalContext || 'None'}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: user }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    res.json({
      title: data.title || "Generated Prompt",
      description: data.description || "AI-generated prompt",
      content: data.content || "",
      suggestedCategory: data.suggestedCategory || "Writing",
    });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "AI error" });
  }
}
