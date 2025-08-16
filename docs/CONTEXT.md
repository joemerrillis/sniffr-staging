# Sniffr – Project Overview & Agent Rules

Sniffr is a multi‑tenant SaaS for dog walking & pet care.
- **API:** Fastify 4 (ESM), plugin‑per‑feature
- **DB:** Postgres (Supabase) – dev project: **Sniffr‑GPT‑Dev**
- **Docs:** OpenAPI JSON at `/docs/json`, RapiDoc at `/rapi-doc/rapidoc.html`
- **Previews:** Render per‑PR; pretty URL `https://pr-<PR>-stage.sniffrpack.com`
- **Agent loop:** `/agent plan` → `/agent revise` → `/agent apply` (Draft PR + self‑review) → `/agent smoke`

## Development Principles
- Prefer **minimal, non‑breaking** diffs unless PR is labeled `breaking-change`.
- Always return **enveloped** responses (no “naked” arrays/objects):
  - Single: `{ resource: { ... } }`
  - List: `{ resources: [ ... ] }`
  - Health: `{ ok: true }`
- OpenAPI must match live DB & examples exactly; keep `/docs/json` green.

## Plugin Architecture (per feature)
Each plugin lives under `src/<feature>/`:
- `routes.js` – Fastify plugin registering all routes for the feature
- (optional) `controllers/`, `services/`, `schemas/` as your project prefers
- Register the plugin in `index.js` with a prefix (see ROUTING.md)

## Migrations (Supabase)
- Files in `supabase/migrations/` with **UTC timestamp** prefix:
  - `YYYYMMDDHHMMSS_description.sql`
  - `YYYYMMDDHHMMSS_description_down.sql` (required)
- Gated apply: add label `apply-migrations` or comment `/apply-migrations`.
- DB conventions: `uuid` PK via `gen_random_uuid()`, `timestamptz DEFAULT now()`, snake_case.

## Testing & Previews
- Each PR deploys to Render (preview host), exposed via Cloudflare worker at:
  - `https://pr-<PR>-stage.sniffrpack.com`
- Use `/agent smoke` on the PR to run live checks (health, docs, basic route probes).

## Source of Truth & Gotchas
- **Schema:** `schema.md.txt` (authoritative DB schema & FKs)
- **Gotchas:** `sniffr_plugin_gotchas.md.txt` (common pitfalls & fixes)
- Keep these synchronized with any new migrations or envelope changes.

## House Conventions
- **JS:** ESM, Node 22, camelCase identifiers
- **HTTP:** 2xx success, 4xx client error; **never** 5xx in normal flows
- **Logging:** use Fastify logger; log inputs for tricky routes during development

- Test preview workflow trigger: August 2025
