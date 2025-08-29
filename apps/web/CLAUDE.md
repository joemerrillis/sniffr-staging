# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Sniffr is a multi-tenant SaaS platform for dog-walking businesses built with Fastify 4 (ESM) and Supabase (PostgreSQL). The system supports white-label deployments with tenant isolation and comprehensive pet care management.

## Development Commands

### Backend (Node.js/Fastify)
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build:index` - Build search index
- `npm run serve:search` - Start search server
- `npm run ctx:fetch` - Fetch context data

### Frontend (Next.js)
- `cd apps/web && npm run dev` - Start Next.js development server
- `cd apps/web && npm run build` - Build for production
- `cd apps/web && npm run lint` - Run ESLint

### Testing
- E2E tests use Playwright: configuration in `playwright.config.ts`
- Test directory: `apps/web/e2e/`
- No unit test framework currently configured

## Architecture

### Plugin-Based Backend Structure
The backend follows a modular plugin architecture where each feature is a separate Fastify plugin:

- **Entry Point**: `index.js` - Registers all plugins and starts server
- **Core Plugin**: `src/core/` - Supabase client, error handling, logging
- **Feature Plugins**: Each feature in `src/{feature}/` with:
  - `routes.js` - Fastify plugin with route definitions
  - `controllers/` - Request handlers
  - `services/` - Business logic
  - `schemas/` - Validation schemas

### Key Features
- **Multi-tenancy**: All data scoped by `tenant_id`
- **Authentication**: JWT-based with role checking
- **API Structure**: All API routes under `/api` prefix
- **Documentation**: OpenAPI/Swagger at `/docs`, RapiDoc at `/rapi-doc/rapidoc.html`

### Database
- **Platform**: Supabase (PostgreSQL)
- **Migrations**: Located in `supabase/migrations/` with UTC timestamp prefixes
- **Schema**: Primary keys use `uuid` with `gen_random_uuid()`, timestamps use `timestamptz`
- **Naming**: snake_case for tables/columns

## Response Conventions

All API responses use envelopes - never return naked arrays or objects:
- Single resource: `{ resource: { ... } }`
- List resources: `{ resources: [...] }`
- Health checks: `{ ok: true }`
- Errors: `{ message: string, code?: string }`

## Frontend Structure

Next.js 15 application in `apps/web/`:
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS v4
- **TypeScript**: Configured with build error ignoring
- **Middleware**: Multi-tenant routing via `middleware.ts`

## Cloudflare Workers

Multiple workers in `workers/` directory for:
- Image processing (`images/`)
- Chat embedding (`chat/`)
- Summary generation (`summary/`)
- Caption generation (`caption/`)
- Tag suggestions (`tags/`)

## Development Workflow

### PR Preview System
- Each PR deploys to Render with URL: `https://pr-<PR>-stage.sniffrpack.com`
- Migrations applied only with `apply-migrations` label or `/apply-migrations` comment
- Smoke tests via `/agent smoke` command

### Key Principles
- Prefer minimal, non-breaking changes unless labeled `breaking-change`
- All HTTP responses must be 2xx/4xx (never 5xx in normal flows)
- OpenAPI documentation must match live database exactly
- Use ESM modules throughout (Node.js with `"type": "module"`)

## Important Files

- `docs/CONTEXT.md` - Development principles and agent rules
- `docs/ROUTING.md` - API routing conventions
- `docs/SCHEMA.md` - Database schema summary
- `docs/TESTING.md` - Testing and preview guidelines