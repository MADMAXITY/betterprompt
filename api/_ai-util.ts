import { aiJson as _aiJson } from "./_env";

export async function aiJson(messages: Array<{ role: string; content: string }>) {
  return _aiJson(messages);
}
