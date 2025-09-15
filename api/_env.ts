import OpenAI from "openai";

// Centralized environment + OpenAI client helper

function resolveStringEnv(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  return trimmed.length ? trimmed : undefined;
}

// Resolve API key from several possible sources with clear precedence:
// 1. OPENAI_API_KEY (direct value)
// 2. If OPENAI_API_KEY not set and OPENAI_API_KEY_ENV_VAR is a name of another var,
//    read process.env[OPENAI_API_KEY_ENV_VAR]. If that isn't set, treat OPENAI_API_KEY_ENV_VAR
//    as a direct key value (for backwards compatibility with previous behavior).
// 3. Common fallbacks used in various deployments.
function resolveOpenAIKey(): string | undefined {
  const direct = resolveStringEnv(process.env.OPENAI_API_KEY);
  if (direct) return direct;

  const altVarOrValue = resolveStringEnv(process.env.OPENAI_API_KEY_ENV_VAR);
  if (altVarOrValue) {
    // If it looks like a var name and exists in env, use that.
    const viaEnv = (process.env as any)[altVarOrValue];
    if (resolveStringEnv(viaEnv)) return viaEnv as string;
    // Otherwise, treat OPENAI_API_KEY_ENV_VAR as a direct key value
    if (altVarOrValue.startsWith("sk-") || altVarOrValue.startsWith("rk-") || altVarOrValue.includes("proj-")) {
      return altVarOrValue;
    }
  }

  // Additional common names some users configure by habit
  const fallbacks = [
    process.env.VERCEL_OPENAI_API_KEY,
    process.env.OPENAI_KEY,
    process.env.AI_API_KEY,
    // Public-prefixed keys (discouraged); use only as last resort if set on server
    process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    process.env.VITE_OPENAI_API_KEY,
  ];
  for (const candidate of fallbacks) {
    const val = resolveStringEnv(candidate);
    if (val) return val;
  }

  return undefined;
}

export function getOpenAIConfig() {
  const apiKey = resolveOpenAIKey();
  const model = resolveStringEnv(process.env.OPENAI_MODEL) || "gpt-4o-mini";
  const rawTemp = resolveStringEnv(process.env.OPENAI_TEMPERATURE);
  const temperature = rawTemp !== undefined ? Number(rawTemp) : undefined;
  return { apiKey, model, temperature } as const;
}

export function createOpenAI() {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) return null as any;
  return new OpenAI({ apiKey });
}

// Minimal JSON body reader for Vercel Node functions
// Ensures we can read body even if the platform does not pre-parse it
export async function readJsonBody<T = any>(req: any): Promise<T | undefined> {
  try {
    if (!req) return undefined;
    if (req.body && typeof req.body === "object") return req.body as T;
    if (typeof req.body === "string") {
      try { return JSON.parse(req.body) as T; } catch { /* fallthrough */ }
    }

    // If no body provided by the platform, try to read the stream
    const chunks: Buffer[] = [];
    const body: string = await new Promise((resolve, reject) => {
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
    if (!body) return undefined;
    try { return JSON.parse(body) as T; } catch { return undefined; }
  } catch {
    return undefined;
  }
}

export async function aiJson(messages: Array<{ role: string; content: string }>) {
  const client = createOpenAI();
  if (!client) throw new Error("OPENAI_API_KEY missing");
  const { model, temperature } = getOpenAIConfig();
  const params: any = { model, messages, response_format: { type: "json_object" } };
  if (typeof temperature === "number" && Number.isFinite(temperature)) params.temperature = temperature;
  return client.chat.completions.create(params);
}

