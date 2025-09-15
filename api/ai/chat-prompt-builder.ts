import { aiJson } from "../_ai-util";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const { messages = [] } = (req.body || {}) as any;
    const system = `You help users craft prompts via conversation. Respond as JSON. For ongoing: {"message":"","suggestions":["..."],"isComplete":false}. For final: {"message":"","isComplete":true,"finalPrompt":"","title":"","category":"","description":""}`;
    const resp = await aiJson([{ role: "system", content: system }, ...messages]);
    const content = resp.choices?.[0]?.message?.content ?? "{}";
    const data = JSON.parse(content);
    res.json({
      message: data.message || "Let's craft your prompt. What's your goal?",
      suggestions: data.suggestions,
      isComplete: !!data.isComplete,
      finalPrompt: data.finalPrompt,
      title: data.title,
      category: data.category,
      description: data.description,
    });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "AI error" });
  }
}
