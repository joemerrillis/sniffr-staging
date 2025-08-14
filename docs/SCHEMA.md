# Sniffr – Schema Summary (Planner/Reviewer focus)

This is a curated summary for the agent. The **full schema** lives in `schema.md.txt` and is the source of truth.

## Conventions
- Primary keys: `id uuid primary key default gen_random_uuid()`
- Timestamps: `created_at timestamptz default now()`
- Names: snake_case for tables/columns
- Tenancy: many tables include `tenant_id uuid not null`
- Indexes: add on common filters (e.g., `(tenant_id)`, `(created_at)`)

## Core Entities (examples, see schema.md.txt for full list)
- **users** — identity (email unique, created_at)
- **dogs** — dog records related to humans/households
- **households** — grouping for humans/dogs; members in **household_members**
- **scheduling / calendar** — e.g., `boarding_calendar_availability`, `boarding_months`
- **operations** — walks, boardings, daycare, pending_services
- **media** — `dog_memories` (image/video, captions, AI captions, transcript, tags/ids)

> Many tables carry `tenant_id`: all feature queries must filter by tenant.

## Relationships (illustrative)
- `household_members.household_id → households.id`
- `household_members.user_id → users.id`
- Operational tables often link to `dog_id`, `human_id`, `walker_id` (see schema.md.txt)

## Migration Rules (CI enforces)
- Every “up” file must have a matching `_down.sql`.
- Avoid `DROP TABLE/COLUMN`. If necessary:
  - add PR label `breaking-change`
  - ensure CI validation passes
- Out‑of‑order timestamps: CI may auto‑retry with `--include-all`.

## Planner Guidance
- When adding fields/tables, update both migration SQL and `schema.md.txt`.
- Align OpenAPI schemas and example payloads with the **actual DB types** (no drift).
