export const config = { runtime: "edge" };

import { ok, badRequest, unauthorized, serverError } from "../_edge";
import { getSupabase } from "../_edge";

export default async function handler(req: Request) {
  const method = (req.method || "GET").toUpperCase();
  const supabase = getSupabase();
  if (!supabase) {
    if (method === "GET") return ok([]);
    if (method === "POST") return ok({ message: "Saved (no-op)" });
    return badRequest("Method not allowed");
  }
  try {
    if (method === "GET") {
      const headers: any = Object.fromEntries(req.headers.entries());
      const auth = headers["authorization"] || headers["Authorization"];
      const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
      if (!token) return unauthorized();
      const { data: userData, error: uErr } = await supabase.auth.getUser(token);
      if (uErr || !userData?.user) return unauthorized();
      const userId = userData.user.id as string;
      const { data, error } = await supabase
        .from("saved_prompts")
        .select("prompt:prompts(*, category:categories(*))")
        .eq("user_id", userId);
      if (error) return serverError(error.message);
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
      return ok(prompts);
    }
    if (method === "POST") {
      const headers: any = Object.fromEntries(req.headers.entries());
      const auth = headers["authorization"] || headers["Authorization"];
      const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
      if (!token) return unauthorized();
      const { data: userData, error: uErr } = await supabase.auth.getUser(token);
      if (uErr || !userData?.user) return unauthorized();
      const userId = userData.user.id as string;
      const body = await req.json().catch(() => ({}));
      const promptId = (body as any)?.promptId as string | undefined;
      if (!promptId) return badRequest("promptId is required");
      const { count } = await supabase
        .from("saved_prompts")
        .select("id", { count: "exact", head: true })
        .match({ prompt_id: promptId, user_id: userId });
      if ((count ?? 0) > 0) return ok({ message: "Already saved" });
      const { data, error } = await supabase
        .from("saved_prompts")
        .insert({ prompt_id: promptId, user_id: userId })
        .select("*")
        .single();
      if (error) return serverError(error.message);
      return ok({
        id: data.id,
        promptId: data.prompt_id,
        userId: data.user_id,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      });
    }
    return badRequest("Method not allowed");
  } catch (e: any) {
    try { console.error("/api/saved-prompts error", e); } catch {}
    return serverError(e?.message || "saved-prompts failed");
  }
}
