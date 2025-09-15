import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const RAW_TEMPERATURE = process.env.OPENAI_TEMPERATURE;
const OPENAI_TEMPERATURE = RAW_TEMPERATURE !== undefined && RAW_TEMPERATURE !== "" ? Number(RAW_TEMPERATURE) : undefined;

export const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null as any;

export async function aiJson(messages: Array<{ role: string; content: string }>) {
  if (!openai) throw new Error("OPENAI_API_KEY missing");
  const params: any = { model: OPENAI_MODEL, messages, response_format: { type: "json_object" } };
  if (typeof OPENAI_TEMPERATURE === "number" && Number.isFinite(OPENAI_TEMPERATURE)) params.temperature = OPENAI_TEMPERATURE;
  return openai.chat.completions.create(params);
}

