# Supabase Auth + Debugging Vercel Visibility

This doc tracks the auth/storage direction and fixes for the issue: “Prompts visible locally but not on Vercel.”

## Current State

- Serverless API on Vercel (`api/[...all].ts`) proxies Express routes under `/api/*`.
- Storage now prefers Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
- Local seeding + `npm run seed:supabase` fills `categories` and `prompts` with the original dataset.
- Local works; Vercel showed empty lists.

## Root Causes We Addressed

1) Function routing/prefix
- Express routes are defined under `/api/*`.
- On Vercel, the catch‑all function could receive paths like `/prompts`.
- Fix: The serverless handlers now mount the Express app under `/api` (`handlerApp.use("/api", app)`) instead of mutating `req.url`.

2) Storage selection
- The server exports Supabase storage only when both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present.
- Verify these are set for all environments (Production, Preview, Development) in Vercel.

3) Data population
- If Supabase is empty in production, run `npm run seed:supabase` locally (uses your `.env.local`) to upsert the full dataset.
- See `SEEDING_SUPABASE.md` for instructions and a truncate snippet.

## Checklist for Vercel

- Environment Variables (Project → Settings → Environment Variables):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
- Rewrites in `vercel.json`:
  - `/api/(.*) -> /api/$1` (serverless function)
  - `/(.*) -> /index.html` (SPA fallback)
- After deploy:
  - Open `/api/categories` and `/api/prompts` on your prod URL — returns Supabase rows.

## Next Steps for Accounts (Google Login)

- Use Client‑Direct (RLS) for user data: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel; enable Google in Supabase; add AuthProvider on client.
- Keep Node for AI endpoints and optional usage tracking.

## If You Still See No Data

- Confirm Vercel logs for `/api/prompts` (should show 200 + JSON payload).
- Double‑check variables scope in Vercel (Production vs Preview).
- Hit `/api/categories` and `/api/prompts` directly; if 404, routing isn’t reaching the function.
- If 200 but empty, verify Supabase tables aren’t empty (Table Editor) and RLS isn’t restricting the service‑role (service‑role bypasses RLS, so likely an env mismatch).
