#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ---------- helpers ----------
function sh(cmd, opts = {}) {
  return execSync(cmd, {
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...opts,
  }).trim();
}
function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}
function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function setOutput(name, value) {
  const outFile = process.env.GITHUB_OUTPUT;
  if (outFile) fs.appendFileSync(outFile, `${name}<<EOF\n${value}\nEOF\n`);
}

// ---------- git context ----------
const base = process.env.GITHUB_BASE_REF || 'origin/main';
const head = process.env.GITHUB_HEAD_REF || 'HEAD';

try {
  // fetch base if running in detached head in CI
  sh('git fetch --no-tags --depth=2 origin +refs/heads/*:refs/remotes/origin/*');
} catch {}

const diffFiles = sh(`git diff --name-only ${base}...${head}`).split('\n').filter(Boolean);
const getFile = (p) => { try { return sh(`git show ${head}:${p}`); } catch { return ''; } };

// ---------- reporting ----------
const human = [];
const structured = [];
let violations = 0;

function v(code, message, meta = {}) {
  human.push(`❌ ${message}`);
  structured.push({ code, message, meta });
  violations++;
}
function ok(message) { human.push(`✅ ${message}`); }
function info(message) { human.push(`ℹ️ ${message}`); }

// ---------- RULES ----------

// 1) Conventional PR title
const title = process.env.PR_TITLE || '';
if (!/^(feat|fix|chore|docs|refactor|perf|test)(!:)?\s*:\s*.+/i.test(title)) {
  v('PR_TITLE', `PR title must follow Conventional Commits (e.g., \`feat: add walks plugin\`). Title received: \`${title}\``, { title });
} else {
  ok('PR title follows Conventional Commits');
}

// 2) Constitution presence
if (!exists('CONSTITUTION.md') && !exists('.github/agent/CONSTITUTION.md')) {
  v('CONSTITUTION_PRESENT', 'CONSTITUTION.md is missing at repo root or .github/agent/CONSTITUTION.md');
} else {
  ok('Constitution document present');
}

// 3) Schema ↔ Migration lockstep
const schemaTouched = diffFiles.some(f => /(^|\/)docs\/SCHEMA\.md$/.test(f) || /(^|\/)schema\.md\.txt$/.test(f));
const migrationsTouched = diffFiles.some(f => f.startsWith('supabase/migrations/'));
if (schemaTouched && !migrationsTouched) v('SCHEMA_MIGRATION_LOCKSTEP', 'Schema doc changed but no migration in supabase/migrations/');
if (migrationsTouched && !schemaTouched) v('SCHEMA_MIGRATION_LOCKSTEP', 'Migration changed but docs/SCHEMA.md (or schema.md.txt) not updated');
if (!schemaTouched && !migrationsTouched) ok('No schema/migration changes detected');

// 4) Plugins must keep envelopes and structure
const pluginFiles = diffFiles.filter(f => f.startsWith('src/'));
if (pluginFiles.length) {
  // 4a) envelope check in controllers
  const controllerFiles = pluginFiles.filter(f => /src\/[^/]+\/controllers\/.+\.\w+$/.test(f));
  for (const f of controllerFiles) {
    const code = getFile(f);
    // heuristic: reply.send({ ... }) must exist; disallow reply.send([ ... ])
    const hasEnvelope = /reply\.(code\(\d+\)\.)?send\(\s*\{[\s\S]*\}\s*\)/.test(code);
    const sendsArray = /reply\.(code\(\d+\)\.)?send\(\s*\[/.test(code);
    if (!hasEnvelope || sendsArray) v('ENVELOPE_REQUIRED', `Controller must return envelope in ${f}`, { file: f });
  }
  if (controllerFiles.length) ok('Controllers present; envelope heuristic applied');

  // 4b) service injection – forbid direct supabase client imports
  const serviceFiles = pluginFiles.filter(f => /src\/[^/]+\/services\/.+\.\w+$/.test(f));
  for (const f of serviceFiles) {
    const code = getFile(f);
    if (/from\s+['"]@?supabase\/.+['"]/i.test(code)) v('SERVICE_INJECTION', `Service must not import Supabase directly (receive via injection): ${f}`, { file: f });
    const acceptsInjected = /function\s+\w+\s*\(\s*supabase\s*[,)]/.test(code) || /\(\s*supabase\s*[,)]/.test(code);
    if (!acceptsInjected) v('SERVICE_INJECTION', `Service functions should accept \`supabase\` as first param: ${f}`, { file: f });
  }
  if (serviceFiles.length) ok('Services present; injection heuristic applied');

  // 4c) schemas existence if routes/controllers added
  const touchedPlugins = new Set(pluginFiles.map(f => f.split('/')[1]));
  for (const p of touchedPlugins) {
    const hasRoutes = diffFiles.some(f => f === `src/${p}/routes.js` || f === `src/${p}/routes.ts`);
    const hasSchemas = exists(`src/${p}/schemas/${p}Schemas.js`) || exists(`src/${p}/schemas/${p}Schemas.ts`);
    if (hasRoutes && !hasSchemas) v('SCHEMA_FILE_REQUIRED', `Plugin ${p} has routes changed but missing schemas file`, { plugin: p });
  }
}

// 5) Smoke workflow usage for previews (presence heuristic)
const usesSmokeReusable =
  diffFiles.some(f => f.startsWith('.github/workflows/') && /smoke-reusable\.yml$/.test(f)) ||
  sh(`git grep -n "smoke-reusable.yml" ${head} || true`).length > 0;
if (!usesSmokeReusable) v('SMOKE_REUSABLE_REQUIRED', 'Preview workflows should call .github/workflows/smoke-reusable.yml');
else ok('Smoke reusable referenced');

// 6) Workers: if workers/ changes, require a test under workers/**/test/
const workerChanged = diffFiles.some(f => f.startsWith('workers/'));
if (workerChanged) {
  const hasTest =
    diffFiles.some(f => /workers\/.*\/test\/.*\.(test|spec)\.(mjs|js|ts)$/.test(f)) ||
    exists('workers/render/test') ||
    exists('workers/*/test');
  if (!hasTest) v('WORKER_TEST_REQUIRED', 'Worker changes require a Miniflare test under workers/**/test/*.test.*');
  else ok('Worker test(s) present or unchanged');
} else {
  ok('No worker changes detected');
}

// 7) Lint config (informational)
if (!exists('.eslintrc.js') && !exists('eslint.config.mjs') && !exists('.eslintrc.cjs')) {
  info('ESLint config not found (informational)');
}

// ---------- OUTPUTS & PROMPT MATERIAL ----------
const outDir = path.join('.github', '.constitution');
ensureDir(outDir);

// Write machine-readable violations
const jsonPath = path.join(outDir, 'violations.json');
fs.writeFileSync(jsonPath, JSON.stringify({ violations: structured }, null, 2));

// Gather canon docs to guide the agent fix step
const canon = {
  constitution: read('CONSTITUTION.md') || read('.github/agent/CONSTITUTION.md'),
  context: read('docs/CONTEXT.md') || read('CONTEXT.md'),
  schema: read('docs/SCHEMA.md') || read('schema.md.txt'),
  gotchas: read('sniffr_plugin_gotchas.md') || read('sniffr_plugin_gotchas.md.txt'),
};

// Build a deterministic repair prompt for your agent
const list = structured.map(vio => `- [${vio.code}] ${vio.message}`).join('\n') || '- (none)';
const prompt = `You are Sniffr's code agent. Fix this branch to satisfy ALL Constitution rules.\n\nViolations to fix:\n${list}\n\nFollow these project canon files EXACTLY (do not invent fields; use schemas/envelopes):\n\n--- CONSTITUTION.md ---\n${canon.constitution}\n\n--- CONTEXT.md ---\n${canon.context}\n\n--- SCHEMA.md ---\n${canon.schema}\n\n--- SNIFFR_PLUGIN_GOTCHAS.md ---\n${canon.gotchas}\n\nOUTPUT MODES:\n1) PLAN (Markdown): bullets of changes, affected files, migrations, OpenAPI, smoke.\n2) APPLY (strict JSON): { summary, commitMessage, files:[{path,contents}] }.\n\nImportant:\n- Controllers must return envelopes (never naked arrays/objects).\n- Services must accept injected \\`supabase\\` param (no direct supabase imports).\n- Schema changes require matching migrations and docs updates.\n- Preview workflows must call smoke-reusable.yml.\n- Worker changes require a Miniflare test.\n`;
const promptPath = path.join(outDir, 'prompt.md');
fs.writeFileSync(promptPath, prompt);

// Human-readable report for PR comment
const humanReport = human.join('\n');
console.log(humanReport);
setOutput('report', humanReport);

// Exit status for CI
if (violations > 0) process.exit(1);
