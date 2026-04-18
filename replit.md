# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### HelpHub AI – Community Support Platform (`artifacts/helphub-ai`)

A fully functional multi-page community support SaaS application built with React + Vite.

**Pages:**
- `/` — Landing page with hero, stats, core flow, featured requests
- `/login` — Authentication with demo user selection and role selection
- `/onboarding` — Multi-step profile setup with AI skill suggestions
- `/dashboard` — User dashboard with stats, recent requests, AI insights
- `/explore` — Help request feed with real-time filters (category, urgency, skills, location)
- `/create-request` — Create requests with AI-powered categorization, tag suggestions, and rewrite
- `/request/:id` — Request detail with AI summary, helper list, and actions
- `/messages` — Messaging between users
- `/leaderboard` — Top helpers rankings with trust scores and badges
- `/ai-center` — AI insights: trend pulse, urgency watch, mentor pool, recommendations
- `/notifications` — Live notification feed with type labels and read/unread state
- `/profile` — User profile with editable identity and public skills/badges display
- `/admin` — Admin panel with request management and analytics

**Data:** All data persisted in LocalStorage. Pre-seeded with 3 demo users (Ayesha Khan, Hassan Ali, Sara Noor) and 4 sample requests.

**AI Features (simulated):**
- `src/lib/ai-engine.ts`: urgency detection, category detection, tag suggestions, request rewriting, skill recommendations

**Key files:**
- `src/lib/storage.ts` — LocalStorage data layer (CRUD for users, requests, messages, notifications)
- `src/lib/ai-engine.ts` — Simulated AI logic
- `src/components/Layout.tsx` — Shared nav layout
- `src/App.tsx` — Router with all 13 routes
- `src/index.css` — Theme with teal primary, warm cream background, Inter font
