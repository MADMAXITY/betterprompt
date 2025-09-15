export const config = { runtime: "nodejs" };

import { aiJson, readJsonBody, getOpenAIConfig } from "../_env";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const { apiKey } = getOpenAIConfig();
    if (!apiKey) return res.status(503).json({ message: "OPENAI_API_KEY not configured" });
    const body = (await readJsonBody(req)) || (req.body || {});
    const { originalPrompt, refinementGoal } = (body || {}) as any;
    if (!originalPrompt || !refinementGoal) return res.status(400).json({ message: "originalPrompt and refinementGoal are required" });
    const system = `You improve prompts. Respond with JSON: {"refinedPrompt":"","improvements":["..."]}`;
    const user = `Original:\n${originalPrompt}\n\nGoal: ${refinementGoal}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: user }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    res.json({ refinedPrompt: data.refinedPrompt || originalPrompt, improvements: data.improvements || [] });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "AI error" });
  }
}
