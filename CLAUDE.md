# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # prisma generate && next build
npm run start        # Start production server
npm run db:push      # Sync Prisma schema to PostgreSQL
npm run db:studio    # Open Prisma Studio
npm run worker       # Start background cron worker (separate process)
```

No test or lint scripts are configured.

## Architecture Overview

**ReviewBot AI** is a Next.js 14 app that automatically generates and posts AI-written responses to Google Maps reviews in Arabic dialects.

### Core Flow

1. User signs in via Google OAuth (NextAuth) — grants `business.manage` scope
2. User adds their Google My Business locations (`/api/locations/discover`)
3. User configures the AI bot per location (`/api/bot-config/[locationId]`)
4. A cron job (every 2h) hits `/api/cron/sync-reviews` (or runs via `workers/reviewWorker.js`) to:
   - Fetch new reviews from Google My Business API
   - Deduplicate by `gmbReviewId` and store in DB
   - Generate AI replies via Gemini 2.0 Flash (through OpenRouter)
   - Post replies back to Google Maps

### Key Libraries

- **Next.js 14** — full-stack framework (API routes + React pages)
- **NextAuth v4 + @auth/prisma-adapter** — Google OAuth, database sessions
- **Prisma 5 + PostgreSQL** — ORM, schema at `prisma/schema.prisma`
- **googleapis** — Google My Business API v4/Business Profile v1
- **openai SDK** (pointed at OpenRouter) — AI reply generation using Gemini 2.0 Flash
- **@anthropic-ai/sdk** — imported but AI calls go through OpenRouter
- **TailwindCSS + Framer Motion** — RTL dark-mode UI in Arabic (Cairo font)

### Important Files

- `lib/auth.ts` — NextAuth config; stores Google OAuth tokens in both `Account` table and `User.googleTokens` (JSON string). Contains 5-attempt retry logic for token storage race conditions.
- `lib/gmb.ts` — Google My Business API wrapper; handles OAuth2 token auto-refresh via event listener.
- `lib/botEngine.ts` — AI reply generation; builds dialect-aware Arabic prompts (saudi/gulf/levant/egyptian/msa), enforces 20-80 word replies, handles per-star-rating overrides and forbidden words.
- `lib/prisma.ts` — Prisma singleton (prevents connection leaks in serverless).
- `workers/reviewWorker.js` — Standalone Node.js cron script; calls the sync API endpoint every 2 hours. Run separately from Next.js.

### Database Models (prisma/schema.prisma)

`User` → `Location` → `Review` + `BotConfig`

- **Location**: tracks `botEnabled`, `lastSyncAt`, aggregate stats
- **Review**: `replyStatus` enum (`PENDING → PROCESSING → REPLIED/FAILED`), `aiGenerated` flag
- **BotConfig**: per-location dialect, personality, tone, per-star custom instructions, forbidden words, emoji toggle, signature

### Environment Variables

See `.env.example`. Key vars:
- `DATABASE_URL` / `DIRECT_URL` (Vercel pooling)
- `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `OPENROUTER_API_KEY` — used for all AI calls
- `CRON_SECRET` — Bearer token protecting `/api/cron/sync-reviews`

### Auth Notes

- Google OAuth redirect URIs must be registered in Google Cloud Console
- Session strategy is database-backed (not JWT)
- `session` callback injects `user.id` into the session object — accessed as `session.user.id`

### UI Notes

- Full RTL interface (`dir="rtl"` on `<html>`)
- All user-facing text is in Arabic
- Dashboard pages are under `app/dashboard/` with a shared layout
