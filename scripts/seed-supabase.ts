import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { MemStorage } from "../server/storage";
import { fileURLToPath } from "url";

// Load local env for convenience
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const localEnv = path.resolve(root, ".env.local");
if (fs.existsSync(localEnv)) dotenv.config({ path: localEnv });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function chunkedUpsert(table: string, rows: any[], onConflict: string) {
  const size = 200;
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) throw error;
  }
}

async function main() {
  console.log("Seeding Supabase with in-memory default data...");
  const mem = new MemStorage();
  const categories = await mem.getCategories();
  const prompts = await mem.getPrompts();

  console.log(`Categories: ${categories.length}, Prompts: ${prompts.length}`);

  // Upsert categories
  await chunkedUpsert(
    "categories",
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      description: c.description,
    })),
    "id",
  );

  // Upsert prompts
  await chunkedUpsert(
    "prompts",
    prompts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      content: p.content,
      category_id: p.category.id || p.categoryId,
      is_featured: p.isFeatured ?? false,
      views: p.views ?? 0,
      likes: p.likes ?? 0,
      created_at: (p.createdAt as any)?.toISOString?.() ?? new Date().toISOString(),
      updated_at: (p.updatedAt as any)?.toISOString?.() ?? new Date().toISOString(),
    })),
    "id",
  );

  console.log("Seed complete ✔");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
