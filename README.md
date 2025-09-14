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

## Environment Variables

- `PORT`: Port to bind the server. Default: `5000`.
  - PowerShell: `$env:PORT='8080'`
  - Bash: `export PORT=8080`
- `NODE_ENV`: `development` or `production`. Controls Vite middleware (dev) vs. static serving (prod).
  - Dev on Windows: `$env:NODE_ENV='development'; npx tsx server/index.ts`
  - Prod on Windows: `$env:NODE_ENV='production'; node dist/index.js`
- `OPENAI_API_KEY`: Your OpenAI API key. Required for AI endpoints under `/api/ai/*`.
- `OPENAI_API_KEY_ENV_VAR`: Optional alternative env var name supported by the code.
- `DATABASE_URL`: PostgreSQL connection string. Required only for Drizzle migrations (`npm run db:push`).
  - Example: `postgres://user:password@host:5432/database`

## Endpoints

- Base URL: `http://localhost:5000`
- Frontend app: `/`
- API base: `/api`
  - GET `/api/categories`
  - GET `/api/prompts`
  - GET `/api/prompts?featured=true`
  - GET `/api/prompts/:id`
  - POST `/api/prompts`
  - PATCH `/api/prompts/:id`
  - POST `/api/prompts/:id/like`
  - POST `/api/ai/generate-prompt`
  - POST `/api/ai/refine-prompt`
  - POST `/api/ai/suggest-improvements`
  - POST `/api/ai/chat-prompt-builder`
  - GET `/api/saved-prompts/:userId`
  - POST `/api/saved-prompts`
  - DELETE `/api/saved-prompts/:promptId/:userId`

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
- AI routes failing: Ensure `OPENAI_API_KEY` is set and that your key has access to the configured model.

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
