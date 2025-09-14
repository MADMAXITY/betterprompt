import { supabase } from "@/lib/supabase";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (!supabase) return {};
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function apiFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const authHeaders = await getAuthHeaders();
  Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));
  return fetch(url, { ...init, headers });
}

export async function getSavedPrompts() {
  const res = await apiFetch("/api/saved-prompts");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function savePrompt(promptId: string) {
  const res = await apiFetch("/api/saved-prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function unsavePrompt(promptId: string) {
  const res = await apiFetch(`/api/saved-prompts/${promptId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

