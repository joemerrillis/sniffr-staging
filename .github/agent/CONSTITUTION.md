Sniffr Plugin Constitution

This document defines the rules, formats, and checklists required for building, testing, and shipping plugins in Sniffr. It ensures consistency across contributors and automation.

Required Output Formats (for agents)
PLAN Mode (Markdown)
Plan

High-level bullet points of tasks

Files

List of filenames and their purpose

OpenAPI

YAML-like paths to be appended to the global OpenAPI spec

Migrations

Filenames and descriptions of database migrations

Smoke

Endpoints and expected statuses

APPLY/EXECUTE Mode (Strict JSON)
{
"summary": "one-line summary",
"commitMessage": "imperative commit message",
"files": [
{ "path": "<relative path>", "contents": "<file contents>" }
]
}
Controller Checklist

Validate input (AJV via route schema) and call service

Wrap results in envelopes ({ x: ... })

Use reply.code(201) for creates; 200 for reads/updates; 204 for deletes with empty body

Log at debug level for payload and response

Service Checklist

Receive { supabase } injected from Fastify

No global imports of Supabase

Build queries with explicit column lists

Handle not-found as 404 via controller

PR Checklist (CI Enforces)

All migrations are idempotent

All new routes are in OpenAPI

All schemas validate with AJV

All services use injected Supabase

All controllers use proper HTTP status codes

Tests and smoke checks are updated

Scripts
1) scripts/scaffold-plugin.mjs

Creates a new Fastify plugin from the schema doc, generating JSON Schemas, routes, controllers, services, and migrations.

node scripts/scaffold-plugin.mjs <pluginName> <tableName> [--entity PascalCase]
# Example:
node scripts/scaffold-plugin.mjs dog_events dog_events --entity DogEvent
2) scripts/scaffold-plugin.mjs Example Implementation
// scripts/scaffold-plugin.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function toPascal(s) {
  return s
    .replace(/[\-\_]+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}


function singularGuess(s) {
  return s.endsWith('s') ? s.slice(0, -1) : s;
}


function mapType(t) {
  const lc = t.toLowerCase();
  if (lc.includes('uuid')) return { type: 'string', format: 'uuid' };
  if (lc.includes('timestamp')) return { type: 'string', format: 'date-time' };
  if (lc.includes('date')) return { type: 'string', format: 'date' };
  if (lc.includes('time')) return { type: 'string', format: 'time' };
  if (lc.includes('text')) return { type: 'string' };
  return { type: 'string' };
}
Testing
3) Smoke Tests – .github/workflows/smoke-reusable.yml

Reusable workflow for validating endpoints return expected statuses.

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - name: Run smoke tests
        uses: ./github/workflows/smoke-reusable.yml
        with:
          base_url: ${{ steps.preview.outputs.api_url }}
          matrix_json: |
            [
              { "path": "/health", "expect": 200 },
              { "path": "/docs/json", "expect": 200 },
              { "path": "/walks", "expect": 200 }
            ]
4) Miniflare Tests – workers/render/test/render-router.test.mjs

Boots the worker and verifies control-plane endpoints respond.

Dev deps in root package.json:

{
  "devDependencies": {
    "miniflare": "^3.20240512.0",
    "vitest": "^1.6.0"
  },
  "scripts": {
    "test:workers": "vitest run workers/render/test/*.test.mjs"
  }
}

Test file:

// workers/render/test/render-router.test.mjs
import { describe, it, expect } from 'vitest';
import { Miniflare } from 'miniflare';
import fs from 'fs';


const mf = new Miniflare({
  scriptPath: 'workers/render/index.mjs'
});


describe('Render Router', () => {
  it('responds to health', async () => {
    const res = await mf.dispatchFetch('http://localhost/health');
    expect(res.status).toBe(200);
  });
});
Enforcement

All plugins must include migrations, OpenAPI updates, and smoke tests.

CI will block PRs that don’t conform to this constitution.

Contributors should run npm run test:workers and npm run lint before PR.
