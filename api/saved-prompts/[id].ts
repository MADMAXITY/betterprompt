export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, unauthorized, serverError, getSupabase, getUrl } from "../_util";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "DELETE") return ok(res, { message: "Method not allowed" });
  try {
    const supabase = await getSupabase();
    const url = getUrl(req);
    const match = url.pathname.match(/\/api\/saved-prompts\/([^/]+)$/);
    const promptId = match?.[1];
    if (!supabase) return ok(res, { message: "Prompt unsaved (no-op)" });
    const { getUserIdFromAuthHeader } = await import("../_util");
    const userId = await getUserIdFromAuthHeader(req, supabase);
    if (!userId) return unauthorized(res);
    await supabase.from("saved_prompts").delete().match({ prompt_id: promptId, user_id: userId });
    return ok(res, { message: "Prompt unsaved successfully" });
  } catch (e: any) {
    try { console.error("/api/saved-prompts/[id] error", e); } catch {}
    return serverError(res, e?.message || "saved-prompts delete failed");
  }
}
