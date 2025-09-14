# Prompt Strategies (AI Builder)

This document describes the three strategies available in the AI Builder and how each one collects input, calls the backend, and produces a prompt that users can review, refine, and save.

## Overview

- Quick Build: Single-form generator for fast results.
- Wizard: Multi‑step, opinionated flow that gathers rich context.
- Chat: Conversational flow that co‑creates a prompt via dialogue.

All strategies ultimately produce a structured prompt object suitable for saving or further refinement.

```
interface GeneratedPrompt {
  title: string
  description: string
  content: string
  suggestedCategory: string
}
```

The backend is provided by Express routes in `server/routes.ts`, which delegate to `server/services/ai-service.ts` (OpenAI).

---

## Quick Build

- Entry: AI Builder → mode "Quick Build" (default in `client/src/pages/ai-builder.tsx`).
- Inputs:
  - goal (required)
  - category (optional)
  - audience (optional)
  - tone (optional)
  - additionalContext (optional)
- Request:
  - POST `/api/ai/generate-prompt`
  - Body: `{ goal, category?, audience?, tone?, additionalContext? }`
- Response shape (server-enforced):
  - `{ title, description, content, suggestedCategory }`
- UX flow:
  - On success, fields are populated and displayed in the right‑hand “Generated Prompt” card.
  - Users can copy, edit, and save. Further improvements can be requested via the Refinement controls (see below).
- Refinement (optional):
  - POST `/api/ai/refine-prompt` with `{ originalPrompt: content, refinementGoal }`
  - Replaces the current `content` with `refinedPrompt` from the response.

### When to use
- You know your goal and want a fast, high‑quality starting point with minimal setup.

---

## Wizard

- Entry: AI Builder → switch to "Wizard" (`client/src/components/wizard-builder.tsx`).
- Purpose: Capture structured, high‑signal context (audience, tone, output format, constraints, etc.).
- Data model (simplified):
  - `goal`, `primaryObjective`, `useCase`
  - `targetAudience`, `domainContext`, `backgroundInfo`, `keyTerms[]`
  - `tone`, `formality`, `perspective`, `communicationStyle`
  - `outputFormat`, `structure[]`, `includeSections[]`
  - `lengthRequirement`, `mustInclude[]`, `mustAvoid[]`, `specialRequirements`
- Request strategy:
  - POST `/api/ai/generate-prompt`
  - Composes a richer `goal` and `additionalContext` string from wizard fields (see implementation at the bottom of the component).
- Response handling:
  - On success, passes `data.content` to the AI Builder page via `onComplete`, populating the editor/preview state.
- Live preview:
  - As users fill steps, a preview is built (not model‑generated) to give a clear outline of what will be asked from the model.

### When to use
- You want maximum control and repeatability (e.g., teams, templates, compliance).

---

## Chat

- Entry: AI Builder → switch to "Chat" (`client/src/components/chat-builder.tsx`).
- Purpose: Natural conversation to explore goals, gather constraints, and converge on the final prompt.
- Request:
  - POST `/api/ai/chat-prompt-builder`
  - Body: `{ messages: Array<{ role: 'user'|'assistant', content: string }>, isComplete?: boolean }`
  - The client sends condensed messages (role + content) to reduce payload size.
- Response shape:
  - Ongoing: `{ message, suggestions?: string[], isComplete: false }`
  - Final: `{ message, isComplete: true, finalPrompt, title, category, description }`
- Completion:
  - When `isComplete` is true, the UI surfaces a “Use This Prompt” action which returns the prompt to AI Builder state for editing/saving.

### When to use
- You prefer iterative discovery or aren’t sure yet what the best prompt should include.

---

## Shared Behaviors & Endpoints

- Generate: `POST /api/ai/generate-prompt` → structured JSON.
- Refine: `POST /api/ai/refine-prompt` → `{ refinedPrompt, improvements[] }`.
- Chat: `POST /api/ai/chat-prompt-builder` → conversational JSON as above.
- All AI endpoints are implemented in `server/services/ai-service.ts` and require `OPENAI_API_KEY`.

## UI/UX Notes

- Quick Build and Wizard both render editable text areas so users can make manual changes post‑generation.
- All modes support copy, save, and optional refinement.
- Category chips tint according to theme; “Writing” gets a stronger dark‑mode background.

## Operational Considerations

- Rate limiting & retries are not implemented server‑side; the client shows friendly errors.
- Ensure `OPENAI_API_KEY` is configured; otherwise AI features will degrade gracefully.
- The in‑memory store is used; saving persists to local storage client‑side until a DB is wired in.

## Extensibility

- Add new modes by following the pattern:
  1) Collect inputs (form, steps, or chat) and compose a request body.
  2) Call an existing endpoint or add a new service method in `ai-service.ts`.
  3) Normalize output into the GeneratedPrompt shape for a consistent editor experience.
