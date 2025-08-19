# Sniffr Agent Constitution

**Purpose**: Ensure every AI‑generated change follows house rules, matches the database schema, and ships behind green smoke checks.

## Canonical References (read first)
- `docs/CONTEXT.md` – plugin architecture, envelope pattern, routing and tagging
- `docs/SCHEMA.md` – live data model and foreign keys (source of truth)
- `docs/TESTING.md` – how we smoke/QA previews
- `sniffr_plugin_gotchas.md` – common failure modes (schema drift, FK errors, envelope mistakes)

## Golden Rules
1. **Schema is King**  
   Never invent columns. Every table/field/type must exist in `docs/SCHEMA.md`. If the schema changes, generate a matching migration and update OpenAPI schemas and examples in the same PR.

2. **Envelope Pattern (Mandatory)**  
   All route handlers return envelopes: `{ thing: ... }` or `{ things: [...] }`. Never return naked arrays/objects.

3. **Plugin Structure**  
   New features are Fastify plugins: `src/<plugin>/` with:
   - `index.js` (register schemas + routes with `fastify-plugin`)
   - `routes.js` (HTTP layer only; tags for Swagger)
   - `controllers/*.js` (validation, envelopes)
   - `services/*.js` (data access only)
   - `schemas/<plugin>Schemas.js` (export **one** object with named JSON Schemas)

4. **Service Injection**  
   Services receive `supabase` from `request.server.supabase`. Do **not** import a global client in services.

5. **Logging for Debuggability**  
   On all create/update/delete: log the input payload and the DB response shape (at debug level).

6. **Swagger / OpenAPI**  
   Group by plugin tags. Request/response schemas must match the DB and the envelope pattern. Examples must reflect reality.

7. **Migrations**  
   Use timestamped filenames: `YYYYMMDDHHMMSS_<name>.sql` with a matching `_down.sql`. Keep migrations and schema docs in sync.

8. **Foreign Keys**  
   Double‑check FK directions against `docs/SCHEMA.md`. Example: `walker_id → employees.id`, not `users.id`.

9. **Naming**  
   Tables/columns: snake_case; PK: `id uuid primary key default gen_random_uuid()` unless a join table.

10. **Small, Safe Diffs**  
   Prefer minimal changes. If unsure, add `/ _agent/health`‑style sanity endpoints under `src/agent_sanity/`.

## Required Output Formats (for agents)

### PLAN Mode (Markdown)
