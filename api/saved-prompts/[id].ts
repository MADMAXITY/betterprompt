export const config = { runtime: "edge" };

import { ok, unauthorized, serverError } from "../_edge";
import { getSupabase, getUrl } from "../_edge";

export default async function handler(req: Request) {
  if ((req.method || "").toUpperCase() !== "DELETE") return ok({ message: "Method not allowed" });
  try {
    const supabase = getSupabase();
    const url = getUrl(req);
    const match = url.pathname.match(/\/api\/saved-prompts\/([^/]+)$/);
    const promptId = match?.[1];
    if (!supabase) return ok({ message: "Prompt unsaved (no-op)" });
    const headers: any = Object.fromEntries(req.headers.entries());
    const auth = headers["authorization"] || headers["Authorization"];
    const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!token) return unauthorized();
    const { data: userData, error: uErr } = await supabase.auth.getUser(token);
    if (uErr || !userData?.user) return unauthorized();
    const userId = userData.user.id as string;
    await supabase.from("saved_prompts").delete().match({ prompt_id: promptId, user_id: userId });
    return ok({ message: "Prompt unsaved successfully" });
  } catch (e: any) {
    try { console.error("/api/saved-prompts/[id] error", e); } catch {}
    return serverError(e?.message || "saved-prompts delete failed");
  }
}
