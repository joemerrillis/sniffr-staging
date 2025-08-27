#!/usr/bin/env node
/**
 * plan-lint.mjs
 * Fail-fast quality gate for /agent plan before any PRs are opened.
 *
 * Enforces:
 * - Backend plugin structure + envelope pattern + schema reality + no direct supabase import
 * - Frontend constitution: App Router placement, TenantThemeProvider, design system, tokens, accessibility hints
 * - Plan output contract (strict JSON shape, contents present for added/modified files)
 *
 * Usage:
 *   node .github/agent/plan-lint.mjs .github/agent/PLAN.json
 */

import fs from 'node:fs';
import path from 'node:path';

const planPath = process.argv[2] || '.github/agent/PLAN.json';
ensure(fs.existsSync(planPath), `Missing plan file at ${planPath}`);
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

const ERR = [];
const WARN = [];

/* ---------- Repo anchors (paths) ---------- */

// Frontend base (adjust if your mono-repo layout differs)
const FE_BASE = 'apps/web/src';

// Canonical frontend locations (from FRONTEND_CONSTITUTION.md)
const FE_APP_DIR = path.join(FE_BASE, 'app');
const FE_LIB_DIR = path.join(FE_BASE, 'lib');
const FE_COMPONENTS_DIR = path.join(FE_BASE, 'components');
const FE_TENANT_PROVIDER = path.join(FE_LIB_DIR, 'theme', 'TenantThemeProvider.tsx');

// Backend anchors (from CONTEXT.md)
const BE_SRC_DIR = 'src';

// Docs (support both docs/SCHEMA.md and schema.md.txt)
const DOCS_CONTEXT = 'docs/CONTEXT.md';
const DOCS_FRONTEND = 'FRONTEND_CONSTITUTION.md';
const DOCS_SCHEMA_MD = 'docs/SCHEMA.md';
const DOCS_SCHEMA_TXT = 'schema.md.txt';
const DOCS_GOTCHAS = 'sniffr_plugin_gotchas.md';

// Load docs if present (for sanity checks and better messages)
const HAVE = {};
for (const p of [DOCS_CONTEXT, DOCS_FRONTEND, DOCS_SCHEMA_MD, DOCS_SCHEMA_TXT, DOCS_GOTCHAS]) {
  HAVE[p] = fs.existsSync(p);
}
const SCHEMA_TEXT = HAVE[DOCS_SCHEMA_MD]
  ? fs.readFileSync(DOCS_SCHEMA_MD, 'utf8').toLowerCase()
  : (HAVE[DOCS_SCHEMA_TXT] ? fs.readFileSync(DOCS_SCHEMA_TXT, 'utf8').toLowerCase() : '');

/* ---------- Basic PLAN shape checks ---------- */

must(Array.isArray(plan.changes), `PLAN.json must include "changes" array.`);
must(typeof plan === 'object' && plan !== null, 'PLAN.json must be a JSON object.');
// Optional but nice: enforce meta fields used by FE/BE checks
if (!plan.meta) {
  WARN.push('PLAN missing "meta" object (not fatal). Consider declaring cookieStrategy, outputFormat, etc.');
}

/* ---------- Global existence checks (cheap) ---------- */

must(fs.existsSync(FE_APP_DIR), `Expected App Router root at ${FE_APP_DIR}`);
must(fs.existsSync(BE_SRC_DIR), `Expected backend source at ${BE_SRC_DIR}`);
if (!fs.existsSync(FE_TENANT_PROVIDER)) {
  WARN.push(`TenantThemeProvider not found at ${FE_TENANT_PROVIDER} (verify path or update linter base).`);
}

/* ---------- Iterate changes ---------- */

for (const ch of plan.changes) {
  must(typeof ch.path === 'string' && ch.path.length > 0, 'Each change must include a non-empty "path"');
  must(['add','modify','delete'].includes(ch.type || ''), `Change ${ch.path}: "type" must be one of add|modify|delete`);

  const isTSX = ch.path.endsWith('.tsx') || ch.path.endsWith('.jsx');
  const isCode = /\.(t|j)sx?$/.test(ch.path);
  const needsContents = (ch.type === 'add' || ch.type === 'modify') && isCode;

  if (needsContents) {
    if (typeof ch.contents !== 'string') {
      ERR.push(`Change ${ch.path}: missing "contents" for ${ch.type} of a code file`);
      continue; // further content checks would be noisy
    }
  }

  // Frontend constitution enforcement
  if (ch.path.startsWith(FE_BASE + '/')) {
    lintFrontendChange(ch);
  }

  // Backend invariants enforcement
  if (ch.path.startsWith(BE_SRC_DIR + '/')) {
    lintBackendChange(ch);
  }
}

/* ---------- Frontend-wide expectations from constitution ---------- */
lintFrontendPlanLevel(plan);

/* ---------- Backend-wide expectations ---------- */
lintBackendPlanLevel(plan);

/* ---------- Output & Exit ---------- */

if (WARN.length) {
  console.warn('Plan Lint warnings:\n- ' + WARN.join('\n- ') + '\n');
}
if (ERR.length) {
  console.error('Plan failed quality gate:\n- ' + ERR.join('\n- '));
  process.exit(1);
}
console.log('Plan Lint passed.');

/* ================================================================
   Frontend lint rules (FRONTEND_CONSTITUTION.md)
   ================================================================ */

function lintFrontendChange(ch) {
  const f = ch.path;
  const contents = ch.contents || '';

  // 1) App Router placement (no legacy pages/, no _app.tsx)
  if (f.includes(`${FE_BASE}/pages/`)) {
    ERR.push(`FE: Invalid path ${f}. App must use App Router under ${FE_APP_DIR}/(tenants)/[tenant]/.../page.tsx`);
  }
  if (/_app\.tsx$/.test(f)) {
    ERR.push(`FE: _app.tsx is forbidden (App Router uses app/layout.tsx + providers). File: ${f}`);
  }

  // 2) New pages must live under app/(tenants)/[tenant]/.../page.tsx
  const isPage = /\/page\.tsx$/.test(f);
  if (isPage) {
    const mustPrefix = new RegExp(`${escapeRx(FE_APP_DIR)}/\\(tenants\\)/\\[tenant\\]/`);
    if (!mustPrefix.test(f)) {
      ERR.push(`FE: ${f} must be placed under ${FE_APP_DIR}/(tenants)/[tenant]/... per Frontend Constitution.`);
    }
    // Require TenantThemeProvider reference (allow layout-provided; soft-assert via import or usage)
    if (ch.type !== 'delete' && !/TenantThemeProvider/.test(contents)) {
      WARN.push(`FE: ${f} does not reference TenantThemeProvider; ensure layout wraps the tree per constitution.`);
    }
  }

  // 3) Must use design system primitives (components/ui/*) for UI work
  const looksLikeUI = isPage || f.startsWith(`${FE_COMPONENTS_DIR}/`);
  if (looksLikeUI && ch.type !== 'delete') {
    const usesPrimitives = /from\s+['"]~?\/?components\/ui\//.test(contents) || /@\/components\/ui\//.test(contents);
    if (!usesPrimitives) {
      ERR.push(`FE: ${f} must use design-system primitives from components/ui/* (no hand-rolled buttons/inputs).`);
    }
  }

  // 4) Tokens first: ban raw hex and arbitrary Tailwind brand colors
  if (ch.type !== 'delete') {
    if (/#([0-9a-fA-F]{3,8})\b/.test(contents)) {
      ERR.push(`FE: ${f} contains raw hex color. Use CSS variables from styles/themes.css (tokens-first rule).`);
    }
    if (/\b(bg|text|border|ring|from|via|to)-\[[^\]]+\]/.test(contents)) {
      ERR.push(`FE: ${f} uses arbitrary Tailwind color classes (e.g., bg-[...]). Map to semantic token classes.`);
    }
  }

  // 5) Accessibility hints (non-fatal but helpful)
  if (ch.type !== 'delete') {
    if (/onClick=/.test(contents) && !/role=/.test(contents) && !/aria-/.test(contents)) {
      WARN.push(`FE: ${f} has clickable element(s). Ensure focusability and aria/role for accessibility.`);
    }
  }

  // 6) Data fetching guidelines: server components by default
  if (isPage && ch.type !== 'delete') {
    const declaresClient = /^\s*['"]use client['"]/.test(contents);
    const usesStateful = /use(State|Effect|Ref|Reducer|FormState)/.test(contents);
    if (declaresClient && !usesStateful) {
      WARN.push(`FE: ${f} declares "use client" without obvious stateful UI; consider server component as default.`);
    }
  }

  // 7) Local vs shared components placement
  if (f.startsWith(`${FE_APP_DIR}/`) && f.includes('/components/') && ch.type !== 'delete') {
    // ok: page-local components under app/.../components/*
    // warn if heavy/shared-looking component is placed locally (heuristic)
    if (/export\s+const\s+[A-Z][A-Za-z0-9]+/.test(contents) && contents.length > 4000) {
      WARN.push(`FE: ${f} looks large; consider moving shared primitives to ${FE_COMPONENTS_DIR}/ per constitution.`);
    }
  }
}

function lintFrontendPlanLevel(plan) {
  // Enforce required plan outputs for agents (PLAN markdown + APPLY strict JSON)
  if (!plan.meta?.outputFormat) {
    WARN.push('FE: plan.meta.outputFormat not declared. Expected "PLAN (Markdown) + APPLY (Strict JSON)".');
  }

  // If the plan adds a login page, ensure it includes basic contracts
  for (const ch of plan.changes) {
    const f = ch.path;
    if (/\/login\/page\.tsx$/.test(f) && ch.type !== 'delete') {
      if (!/form/i.test(ch.contents || '')) {
        WARN.push(`FE: ${f} does not contain a login form stub. Include structured fields and submit handler.`);
      }
      // Require using API wrapper for data fetch calls if present
      if (/\bfetch\(/.test(ch.contents || '') && !/from\s+['"]~?\/?lib\/api['"]/.test(ch.contents || '')) {
        WARN.push(`FE: ${f} uses fetch directly; prefer lib/api.ts wrapper with error boundaries.`);
      }
    }
  }
}

/* ================================================================
   Backend lint rules (CONTEXT.md, sniffr_plugin_gotchas.md, schema)
   ================================================================ */

function lintBackendChange(ch) {
  const f = ch.path;
  const contents = ch.contents || '';

  // 1) Enforce plugin-per-feature structure for backend code
  // Expect files under src/<plugin>/(schemas|services|controllers|routes.js|index.js)
  const segs = f.split('/');
  if (segs.length >= 3) {
    const plugin = segs[1]; // src/<plugin>/...
    const sub = segs[2] || '';
    const isPluginFile =
      ['schemas', 'services', 'controllers'].includes(sub) ||
      segs.slice(2).join('/') === 'routes.js' ||
      segs.slice(2).join('/') === 'index.js';

    if (!isPluginFile && ch.type !== 'delete') {
      WARN.push(`BE: ${f} is not in a canonical plugin subfolder (schemas/services/controllers/routes.js/index.js). Verify placement.`);
    }
  }

  // 2) Envelope pattern: routes.js or controllers must declare envelope usage in meta
  if ((/routes\.js$/.test(f) || /controller\.js$/.test(f)) && ch.type !== 'delete') {
    const envelope = ch.meta?.responseEnvelopeKey;
    if (!envelope) {
      ERR.push(`BE: ${f} must declare meta.responseEnvelopeKey (e.g., "walk", "walks", "auth"). Envelope pattern is mandatory.`);
    }
  }

  // 3) No direct supabase import in services/controllers; require DI via decorated instance
  if ((/services\/.*\.(t|j)s$/.test(f) || /controllers\/.*\.(t|j)s$/.test(f)) && ch.type !== 'delete') {
    if (/\bfrom\s+['"]@?supabase[\/-]/.test(contents) || /\.from\(/.test(contents) && /createClient\(/.test(contents)) {
      ERR.push(`BE: ${f} imports/creates Supabase directly. Services must receive request.server.supabase (decorated DI).`);
    }
  }

  // 4) Auth endpoints must live under src/auth/*
  if (/(^|\/)auth(\/|\.|$)/.test(f) && !f.startsWith('src/auth/')) {
    ERR.push(`BE: Auth endpoints must live under src/auth/* plugin. Found ${f}.`);
  }

  // 5) Schema reality: if plan references a table, it must exist in schema doc
  const t = ch.meta?.table;
  if (t && !SCHEMA_TEXT) {
    WARN.push('BE: schema doc not found; cannot validate table names. Add docs/SCHEMA.md or schema.md.txt to repo.');
  } else if (t && SCHEMA_TEXT) {
    const needle = `\n${String(t).toLowerCase()}\n`;
    if (!SCHEMA_TEXT.includes(needle)) {
      ERR.push(`BE: plan references table "${t}" not found in schema docs (docs/SCHEMA.md or schema.md.txt).`);
    }
  }

  // 6) Controllers should not talk to DB directly; they should call services
  if (/controllers\/.*\.(t|j)s$/.test(f) && ch.type !== 'delete') {
    if (/supabase\./.test(contents) || /\.from\(/.test(contents)) {
      ERR.push(`BE: ${f} appears to access DB in a controller. Move data access into services layer.`);
    }
  }
}

function lintBackendPlanLevel(plan) {
  // If any backend route is added/modified, recommend tagging for Swagger/OpenAPI
  for (const ch of plan.changes) {
    const f = ch.path;
    if (/src\/.+\/routes\.js$/.test(f) && ch.type !== 'delete') {
      if (!/tags:\s*\[/.test(ch.contents || '')) {
        WARN.push(`BE: ${f} route definitions should include Swagger/OpenAPI tags (see CONTEXT.md).`);
      }
    }
  }
}

/* ---------- Utilities ---------- */

function ensure(cond, msg) {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}
function must(cond, msg) {
  if (!cond) ERR.push(msg);
}
function escapeRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
