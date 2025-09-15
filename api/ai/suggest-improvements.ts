import { aiJson } from "../_ai-util";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const { prompt } = (req.body || {}) as any;
    if (!prompt) return res.status(400).json({ message: "prompt is required" });
    const system = `You are an expert prompt engineer. Respond with JSON {"suggestions":["..."]}`;
    const user = `Analyze and suggest improvements for this prompt:\n\n${prompt}`;
    const resp = await aiJson([{ role: "system", content: system }, { role: "user", content: user }]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    const data = JSON.parse(content);
    res.json({ suggestions: data.suggestions || [] });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "AI error" });
  }
}
