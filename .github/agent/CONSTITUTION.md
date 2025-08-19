# Sniffr Constitution (Machine-Oriented Spec)

This document defines the **authoritative ruleset** for generating, reviewing, and enforcing code contributions within the Sniffr project. It is optimized for **AI agents** and **automation workflows** to reference directly.

---

## 1. PURPOSE

* Enforce **consistency** across plugins, services, and frontend.
* Guarantee that every change ships with **tests, docs, and migrations**.
* Provide a **machine-parsable contract** for AI-driven development.

---

## 2. AGENT OUTPUT FORMATS

### 2.1 PLAN Output

* Summarize intended changes.
* Must include:

  * Files to be created/modified.
  * Endpoints to be exposed.
  * Migrations required.
  * Tests required.
* Format: Markdown list with file paths.

### 2.2 APPLY / EXECUTE Output

* Provide final code.
* Each file must be wrapped in fenced code blocks (`lang ... `).
* No commentary outside of the plan unless marked as `NOTE:`.

---

## 3. CONTROLLERS & SERVICES

### 3.1 Controller Rules

* Controllers handle **HTTP layer only**.
* Must:

  * Validate request.
  * Call corresponding service.
  * Return structured JSON.
* Must not:

  * Contain business logic.

### 3.2 Service Rules

* Services contain **business logic only**.
* Must:

  * Be pure functions where possible.
  * Interact with models, DB, or external APIs.
* Must not:

  * Parse HTTP requests.

---

## 4. TESTING REQUIREMENTS

### 4.1 Smoke Tests

* Required for every plugin.
* Must:

  * Cover all public endpoints.
  * Assert 200 response on happy path.
  * Fail gracefully if DB or service unavailable.
* Format: Jest + Supertest.

### 4.2 Miniflare Tests

* Required for Cloudflare Worker code.
* Must:

  * Run under `miniflare` runtime.
  * Assert routes behave identically to production worker.

---

## 5. MIGRATIONS & SCHEMAS

### 5.1 Database Migrations

* Every new table/column requires a migration.
* Migration files must:

  * Be idempotent.
  * Follow naming: `YYYYMMDDHHMM_description.sql`.
  * Be validated in CI (`validate-migrations.yml`).

### 5.2 OpenAPI Schemas

* All new endpoints must:

  * Update `schema.md`.
  * Include request + response shapes.
  * Be referenced in controller JSDoc.

---

## 6. SCAFFOLDING

### 6.1 Tooling

* Use `scaffold-plugin.mjs` to generate new plugin structure.
* Generated files must include:

  * `index.ts` (registers routes).
  * `routes.ts` (Fastify routes).
  * `schemas.ts` (Zod or JSON schema).
  * `plugin-smoke.test.ts`.

### 6.2 Example Command

```bash
node scripts/scaffold-plugin.mjs boardingReports
```

---

## 7. ENFORCEMENT RULES

### 7.1 Pull Request Rules

* CI will reject PRs that:

  * Lack migrations when schema changes.
  * Lack OpenAPI updates for new endpoints.
  * Lack smoke test coverage.
* PR titles must match: `Feature: <name>` or `Fix: <name>`.

### 7.2 Commit Rules

* Use Conventional Commits:

  * `feat: add boardingReports plugin`
  * `fix: correct walker availability bug`

### 7.3 Branch Rules

* `main` is protected.
* All changes must land via PR.
* Preview deployments required for frontend + backend.

---

## 8. FRONTEND RULES

### 8.1 Next.js

* Use **App Router** (`app/` directory).
* Each route must:

  * Have a `page.tsx`.
  * Be styled with Tailwind.

### 8.2 API Routes

* Defined in `app/api/*/route.ts`.
* Must:

  * Call backend worker endpoints.
  * Handle auth via middleware.

---

## 9. CHECKLIST (AI ENFORCEMENT)

When generating a new feature, AI agents must:

* [ ] Create migration if DB schema changes.
* [ ] Update `schema.md`.
* [ ] Scaffold plugin via `scaffold-plugin.mjs`.
* [ ] Add smoke test.
* [ ] Add miniflare test (if worker code).
* [ ] Add OpenAPI docs.
* [ ] Ensure controller/service separation.
* [ ] Verify PR title & commit message format.

---

## 10. REFERENCES

* `schema.md` → canonical OpenAPI spec.
* `sniffr_plugin_gotchas.md` → pitfalls and lessons learned.
* `CONTEXT.md` → project-wide design notes.

---

**This spec is binding. All PRs must comply.**
