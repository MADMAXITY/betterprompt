import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Supabase client (works with service role or anon key) if configured
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Health
app.get("/api/health", async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({
        ok: true,
        env: {
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
          VERCEL: !!process.env.VERCEL,
        },
        counts: { categories: 0, prompts: 0 },
      });
    }

    const { count: catCount, error: catErr } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });
    const { count: pCount, error: pErr } = await supabase
      .from("prompts")
      .select("id", { count: "exact", head: true });
    res.json({
      ok: true,
      env: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        VERCEL: !!process.env.VERCEL,
      },
      counts: { categories: catErr ? 0 : catCount || 0, prompts: pErr ? 0 : pCount || 0 },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

// Categories
app.get("/api/categories", async (_req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
});

// Prompts list and filters
app.get("/api/prompts", async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { category, search, featured } = req.query as Record<string, string | undefined>;
    let query = supabase.from("prompts").select("*, category:categories(*)");

    if (category) query = query.eq("category_id", category);
    if (featured === "true") query = query.eq("is_featured", true);
    if (search) {
      const q = `%${search}%`;
      query = query.or(`title.ilike.${q},description.ilike.${q},content.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: (e as Error).message });
  }
});

// Prompt by id
app.get("/api/prompts/:id", async (req, res) => {
  if (!supabase) return res.status(404).json({ message: "Prompt not found" });
  const { data, error } = await supabase
    .from("prompts")
    .select("*, category:categories(*)")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: "Prompt not found" });
  res.json(data);
});

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
