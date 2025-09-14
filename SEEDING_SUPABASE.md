# Seeding Supabase with the Original Prompts

This project can push the built-in local prompt library to your Supabase database.

## Prerequisites

- Supabase project created
- Tables and RLS created (run the SQL from `v2.md` first)
- Env vars present in `.env.local` at repo root:
  - `SUPABASE_URL=https://<project-ref>.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`

Optional (for the app):
- `OPENAI_API_KEY=...`

## Seed Command

From the repo root:

```
npm run seed:supabase
```

What it does:
- Instantiates the in‑memory storage used locally (which contains the full original dataset)
- Reads all categories and prompts
- Upserts them into Supabase tables `categories` and `prompts`

Notes:
- The script is idempotent. It uses `upsert` on primary key `id`.
- If you want a clean slate, truncate the tables first:

```sql
truncate table saved_prompts restart identity cascade;
truncate table prompts restart identity cascade;
truncate table categories restart identity cascade;
```

## Verify

- Check: Supabase → Table Editor → `categories` and `prompts` have rows
- API test (local): `http://localhost:5000/api/prompts`
- API test (Vercel): `https://<your-app>.vercel.app/api/prompts`

If everything looks good, your UI should now display the library.
