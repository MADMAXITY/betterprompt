import { aiJson, readJsonBody, getOpenAIConfig } from "../_env";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const { apiKey } = getOpenAIConfig();
    if (!apiKey) return res.status(503).json({ message: "OPENAI_API_KEY not configured" });
    const body = (await readJsonBody(req)) || (req.body || {});
    const { prompt } = (body || {}) as any;
    if (!prompt) return res.status(400).json({ message: "prompt is required" });
    const system = `You are an expert prompt engineer. Respond with JSON {"suggestions":["..."]}`;
    const user = `Analyze and suggest improvements for this prompt:\n\n${prompt}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: user }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    let data: any = {};
    try { data = JSON.parse(content); } catch { data = {}; }
    res.json({ suggestions: data.suggestions || [] });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "AI error" });
  }
}
