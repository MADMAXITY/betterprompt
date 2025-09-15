# Better Prompt (PromptSage) – AI Prompt Library & Builder

## Overview

Better Prompt is a full-stack web application that serves as a comprehensive library and builder for AI prompts. The platform allows users to discover, save, and create high-quality prompts for various AI applications. It features a modern React frontend with a Node.js/Express backend, providing both a curated prompt library and AI-powered prompt generation capabilities.

## Quick Start

- Install dependencies: `npm install`
- Development (Mac/Linux): `npm run dev`
- Development (Windows, PowerShell): `npx tsx server/index.ts`
- Open the app: `http://localhost:5000`

### UI Features

- Built-in iconography via Font Awesome (CDN) and lucide-react components
- Dark/Light mode with a toggle in the top navigation

## Production

- Build: `npm run build`
- Start (Mac/Linux): `npm start`
- Start (Windows, PowerShell): `$env:NODE_ENV='production'; node dist/index.js`

## Deployment (Vercel)

- This app uses a single catch‑all Serverless Function for all API routes: `api/[[...route]].ts`.
  - Runtime: Node.js (`export const config = { runtime: "nodejs" }`).
  - Handles: `/api/health`, `/api/categories`, `/api/prompts`, `/api/prompts/:id`, `/api/saved-prompts` (GET/POST), `/api/saved-prompts/:promptId` (DELETE), and AI routes under `/api/*` and `/api/ai/*`.
  - Rationale: avoids the Vercel Hobby plan function-count limit and fixes routing/parsing inconsistencies.

- Environment variables (set in Vercel Project → Settings → Environment Variables):
  - `OPENAI_API_KEY`: Recommended. Direct OpenAI API key for AI endpoints.
  - `OPENAI_API_KEY_ENV_VAR`: Optional. Either the name of another env var holding the key (e.g. `VERCEL_OPENAI_API_KEY`) or the literal key itself.
  - `SUPABASE_URL`: Optional. When set with a key, enables DB‑backed prompt/category lists.
  - `SUPABASE_SERVICE_ROLE_KEY`: Optional. Preferred server key for Supabase.
  - `VITE_SUPABASE_ANON_KEY`: Optional. Fallback server key if service role isn’t supplied.

### Supabase Fallback Behavior

- If Supabase is not configured or errors, the API returns seeded categories and prompts instead of 500:
  - See `server/default-data.ts` for seeds.
  - Seeded prompts are returned in the `PromptWithCategory` shape (includes `prompt.category`).
  - Saved prompts endpoints become no‑ops that still return success responses.

### OpenAI Configuration

- Centralized resolution in `api/_env.ts` looks for a key in:
  - `OPENAI_API_KEY` (preferred)
  - `OPENAI_API_KEY_ENV_VAR` (var name or literal key)
  - Fallbacks: `VERCEL_OPENAI_API_KEY`, `OPENAI_KEY`, `AI_API_KEY` (as a last resort, public‑prefixed vars if present server‑side)
- AI endpoints return HTTP 503 with a clear message if no key is available (instead of crashing).

### Verify After Deploy

- `GET /api/health` → JSON with `ok: true`, env flags, counts.
- `GET /api/categories`, `GET /api/prompts`, `GET /api/prompts?featured=true` → 200 with data (seeds if Supabase missing).
- `POST /api/generate-prompt`, `POST /api/refine-prompt`, `POST /api/chat-prompt-builder` → 200 if OpenAI key present; 503 otherwise.

### Troubleshooting

- API returns 500 on Vercel:
  - Ensure only the catch‑all `api/[[...route]].ts` exists (remove extra serverless route files to avoid conflicts and function‑count limits).
  - Confirm env vars are set and available to Serverless (Project → Settings → Environment Variables → Production).
- Prompt library empty on Vercel:
  - Without Supabase, you should still see seeded prompts. Verify `/api/prompts` returns seed data and the objects include `category` with a `name`.
- AI endpoints failing:
  - Verify `OPENAI_KEY: true` in `/api/health`. If false, set `OPENAI_API_KEY` (or supported alternatives) and redeploy.

## Environment Variables

- `PORT`: Port to bind the server. Default: `5000`.
  - PowerShell: `$env:PORT='8080'`
  - Bash: `export PORT=8080`
- `NODE_ENV`: `development` or `production`. Controls Vite middleware (dev) vs. static serving (prod).
  - Dev on Windows: `$env:NODE_ENV='development'; npx tsx server/index.ts`
  - Prod on Windows: `$env:NODE_ENV='production'; node dist/index.js`
- `OPENAI_API_KEY`: Your OpenAI API key. Required for AI endpoints under `/api/ai/*`.
- `OPENAI_API_KEY_ENV_VAR`: Optional. You can either set this to:
  - the name of another env var that actually holds your key (e.g. `VERCEL_OPENAI_API_KEY`), or
  - the key value itself. The server prefers `OPENAI_API_KEY` if present.
  - Additionally, common fallbacks are supported on server: `VERCEL_OPENAI_API_KEY`, `OPENAI_KEY`, `AI_API_KEY`, and as a last resort `NEXT_PUBLIC_OPENAI_API_KEY` / `VITE_OPENAI_API_KEY` if present in the server runtime.
- `DATABASE_URL`: PostgreSQL connection string. Required only for Drizzle migrations (`npm run db:push`).
  - Example: `postgres://user:password@host:5432/database`

## Endpoints

- Base URL: `http://localhost:5000`
- Frontend app: `/`
- API base: `/api`
  - GET `/api/health`
  - GET `/api/categories`
  - GET `/api/prompts`
  - GET `/api/prompts?featured=true`
  - GET `/api/prompts/:id`
  - POST `/api/generate-prompt`
  - POST `/api/refine-prompt`
  - POST `/api/suggest-improvements`
  - POST `/api/chat-prompt-builder`
  - GET `/api/saved-prompts`
  - POST `/api/saved-prompts`
  - DELETE `/api/saved-prompts/:promptId`

## Scripts

- `npm run dev`: Start Express + Vite (middleware) in development.
- `npm run build`: Build client (Vite) and bundle server (esbuild) to `dist/`.
- `npm start`: Run the bundled server from `dist/index.js` (production).
- `npm run check`: Type-check with `tsc`.
- `npm run db:push`: Apply Drizzle migrations (requires `DATABASE_URL`).

## Windows Notes

- The `NODE_ENV=...` inline syntax is POSIX-only. On Windows/PowerShell, set env vars separately, e.g.:
  - Dev: `$env:NODE_ENV='development'; npx tsx server/index.ts`
  - Prod: `$env:NODE_ENV='production'; node dist/index.js`

## Replit

- Run button uses `npm run dev` (see `.replit`).
- Deploy uses `npm run build` then `npm run start`.

## Troubleshooting

- Port busy: Change the port via `PORT` (e.g., `$env:PORT='5001'`).
- AI routes failing: Ensure the server runtime has access to an OpenAI key via any of the supported variables above. On Vercel, set the variable in Project Settings → Environment Variables.

## System Architecture

### Frontend Architecture
- Framework: React 18 with TypeScript using Vite as the build tool
- UI Components: Shadcn/ui component library with Radix UI primitives
- Styling: Tailwind CSS with custom design system and CSS variables
- Routing: Wouter for lightweight client-side routing
- State Management: TanStack Query (React Query) for server state management
- Data Persistence: Local Storage for client-side data (saved prompts, user-created prompts)

### Backend Architecture
- Runtime: Node.js with Express.js framework
- Language: TypeScript with ES modules
- API Pattern: RESTful API design with structured error handling
- Storage Strategy: In-memory storage implementation with interface-based design for easy database migration
- AI Integration: OpenAI API integration for prompt generation and refinement

### Component Structure
- Pages: Home (prompt library), AI Builder (prompt creation), My Prompts (saved/user prompts)
- Builders: Three prompt creation modes - Simple form, Wizard-guided, and Chat-based
- Modals: Prompt editor, AI editing capabilities
- Navigation: Responsive design with desktop navigation bar and mobile bottom navigation

### Data Models
- Categories: Organize prompts by type (Writing, Coding, Marketing, Business, Education)
- Prompts: Core content with metadata (title, description, content, category, views, likes)
- Users: Basic user system for future authentication
- Saved Prompts: User collections and favorites

### AI Service Features
- Prompt Generation: Create prompts based on user goals and context
- Prompt Refinement: AI-powered editing and improvement suggestions
- Multi-mode Creation: Support for different creation workflows (simple, wizard, conversational)

## External Dependencies

### Database & ORM
- Drizzle ORM: Type-safe database interactions with PostgreSQL dialect
- PostgreSQL: Primary database (configured but using in-memory storage initially)
- Neon Database: Serverless PostgreSQL provider integration

### AI Services
- OpenAI API: GPT models for prompt generation and refinement
- API Integration: Structured request/response handling for AI operations

### UI & Styling
- Radix UI: Accessible component primitives for complex UI elements
- Tailwind CSS: Utility-first styling with custom design tokens
- Lucide React: Icon library for consistent iconography
- Embla Carousel: Component carousels and sliders

### Development Tools
- Vite: Fast development server and build tool with React plugin
- TypeScript: Type safety across frontend and backend
- ESBuild: Fast bundling for production builds
- Replit Integration: Development environment plugins and error handling

### Form & Validation
- React Hook Form: Form state management and validation
- Zod: Schema validation and type inference
- Drizzle-Zod: Integration between Drizzle schemas and Zod validation

### Utilities
- Date-fns: Date manipulation and formatting
- Class Variance Authority: Type-safe CSS class variants
- CLSX: Conditional class name utility
- Nanoid: Unique ID generation
