# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A minimalist mobile-first personal journaling app. Nuxt 4 monolith (SSR + API) backed by PostgreSQL. One entry per user per day, full-text search, OIDC auth (with dev-mode bypass).

## Commands

```bash
# Local development (requires mise, Docker)
mise run start          # Creates k3d cluster + starts Tilt (app + Postgres)
mise run stop           # Tears down the k3d cluster

# Direct Nuxt dev (needs running Postgres)
npx nuxi dev

# Build
npx nuxi build

# Tests (requires Postgres on localhost:5432, provided by Tilt)
npx vitest run                    # Run all tests
npx vitest run tests/entries      # Run a specific test file
npx vitest --watch                # Watch mode

# Database schema management (uses DATABASE_URL env var, not NUXT_DATABASE_URL)
npx drizzle-kit push
npx drizzle-kit generate
```

No linter or formatter is configured.

## Architecture

### Stack

Nuxt 4 (`app/` directory convention) · Vue 3.5 Composition API · tRPC 11 (via `trpc-nuxt`) · Drizzle ORM · PostgreSQL · Tailwind CSS · `nuxt-auth-utils`

### Request Flow

Pages (`app/pages/`) → tRPC client plugin (`app/plugins/trpc.ts`) → catch-all handler (`server/api/trpc/[trpc].ts`) → tRPC routers (`server/trpc/routers/`) → Drizzle ORM → Postgres

### Key Directories

- `app/` — Frontend: pages, components, composables, middleware, plugins
- `server/trpc/` — tRPC init, context, and routers. `protectedProcedure` enforces auth.
- `server/database/schema.ts` — Drizzle schema (users + entries tables)
- `server/utils/db.ts` — Lazy-initialized DB connection via Proxy
- `server/routes/auth/` — Auth endpoints (OIDC + dev-mode)
- `shared/types/auth.d.ts` — Session type augmentation for `nuxt-auth-utils`
- `deploy/` — Helm chart
- `tilt/` — Local dev k3d + Postgres manifests + Helm value overrides

### Auth

Global middleware (`app/middleware/auth.global.ts`) redirects unauthenticated users to `/login`. Two auth modes:
- **OIDC** — When `NUXT_OAUTH_OIDC_CLIENT_ID` is set, uses `/auth/oidc`
- **Dev** — When OIDC is not configured, `/auth/dev` auto-creates a dev user

### Database

Two tables: `users` (UUID PK, unique OIDC `subject`) and `entries` (UUID PK, FK to users, unique `(user_id, date)`, GIN index for full-text search). No migration files exist yet — tests create schema via raw SQL in `tests/setup.ts`.

### Testing

Integration tests use `createCaller` from the tRPC router against a real Postgres database (no HTTP, no mocks). Test setup in `tests/setup.ts` manages schema creation, user factory, and cleanup.

### Deployment

Docker multi-stage build → `ghcr.io/f1nnm/journal`. Helm chart published to `oci://ghcr.io/f1nnm/journal-charts`. CI tags images/charts with git SHA; GitHub releases add semver tags.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NUXT_DATABASE_URL` | PostgreSQL connection string (runtime) |
| `NUXT_SESSION_PASSWORD` | Cookie encryption key (min 32 chars) |
| `NUXT_OAUTH_OIDC_CLIENT_ID` | OIDC client ID (absence enables dev auth) |
| `NUXT_OAUTH_OIDC_CLIENT_SECRET` | OIDC client secret |
| `NUXT_OAUTH_OIDC_OPENID_CONFIG` | OIDC discovery URL |
| `NUXT_OAUTH_OIDC_REDIRECT_URL` | OIDC callback URL |
| `DATABASE_URL` | Used by drizzle-kit only (not runtime) |
