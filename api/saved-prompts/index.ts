export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, badRequest, unauthorized, serverError, readJsonBody, getSupabase } from "../_util";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = (req.method || "GET").toUpperCase();
  const supabase = await getSupabase();
  if (!supabase) {
    if (method === "GET") return ok(res, []);
    if (method === "POST") return ok(res, { message: "Saved (no-op)" });
    return badRequest(res, "Method not allowed");
  }
  try {
    if (method === "GET") {
      const { getUserIdFromAuthHeader } = await import("../_util");
      const userId = await getUserIdFromAuthHeader(req, supabase);
      if (!userId) return unauthorized(res);
      const { data, error } = await supabase
        .from("saved_prompts")
        .select("prompt:prompts(*, category:categories(*))")
        .eq("user_id", userId);
      if (error) return serverError(res, error.message);
      const prompts = (data || []).map((row: any) => ({
        id: row.prompt.id,
        title: row.prompt.title,
        description: row.prompt.description,
        content: row.prompt.content,
        categoryId: row.prompt.category_id,
        isFeatured: !!row.prompt.is_featured,
        views: row.prompt.views ?? 0,
        likes: row.prompt.likes ?? 0,
        createdAt: row.prompt.created_at ? new Date(row.prompt.created_at) : new Date(),
        updatedAt: row.prompt.updated_at ? new Date(row.prompt.updated_at) : new Date(),
        category: row.prompt.category,
      }));
      return ok(res, prompts);
    }
    if (method === "POST") {
      const { getUserIdFromAuthHeader } = await import("../_util");
      const userId = await getUserIdFromAuthHeader(req, supabase);
      if (!userId) return unauthorized(res);
      const body = (await readJsonBody(req)) || {};
      const promptId = (body as any)?.promptId as string | undefined;
      if (!promptId) return badRequest(res, "promptId is required");
      const { count } = await supabase
        .from("saved_prompts")
        .select("id", { count: "exact", head: true })
        .match({ prompt_id: promptId, user_id: userId });
      if ((count ?? 0) > 0) return ok(res, { message: "Already saved" });
      const { data, error } = await supabase
        .from("saved_prompts")
        .insert({ prompt_id: promptId, user_id: userId })
        .select("*")
        .single();
      if (error) return serverError(res, error.message);
      return ok(res, {
        id: data.id,
        promptId: data.prompt_id,
        userId: data.user_id,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      });
    }
    return badRequest(res, "Method not allowed");
  } catch (e: any) {
    try { console.error("/api/saved-prompts error", e); } catch {}
    return serverError(res, e?.message || "saved-prompts failed");
  }
}
