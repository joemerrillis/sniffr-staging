#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';


function sh(cmd, opts={}) { return execSync(cmd, { stdio: ['pipe','pipe','pipe'], encoding: 'utf8', ...opts }).trim(); }
function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }


const base = process.env.GITHUB_BASE_REF || 'origin/main';
const head = process.env.GITHUB_HEAD_REF || 'HEAD';


// fetch base if running on a detached head
try { sh('git fetch --no-tags --depth=2 origin +refs/heads/*:refs/remotes/origin/*'); } catch {}


const diffFiles = sh(`git diff --name-only ${base}...${head}`).split('\n').filter(Boolean);
const getFile = (p) => { try { return sh(`git show ${head}:${p}`); } catch { return ''; } };
const getBaseFile = (p) => { try { return sh(`git show ${base}:${p}`); } catch { return ''; } };


const report = [];
let violations = 0;
function v(msg){ report.push(`❌ ${msg}`); violations++; }
function ok(msg){ report.push(`✅ ${msg}`); }


// 1) Conventional PR title
const title = process.env.PR_TITLE || '';
if (!/^(feat|fix|chore|docs|refactor|perf|test)(!:)?\s*:\s*.+/i.test(title)) {
v(`PR title must follow Conventional Commits (e.g., \`feat: add walks plugin\`). Title received: \`${title}\``);
} else ok('PR title follows Conventional Commits');


// 2) Constitution presence
if (!exists('CONSTITUTION.md') && !exists('.github/agent/CONSTITUTION.md')) {
v('CONSTITUTION.md is missing at repo root or .github/agent/CONSTITUTION.md');
} else ok('Constitution document present');


// 3) Schema ↔ Migration lockstep
const schemaTouched = diffFiles.some(f => /(^|\/)docs\/SCHEMA\.md$/.test(f) || /(^|\/)schema\.md\.txt$/.test(f));
const migrationsTouched = diffFiles.some(f => f.startsWith('supabase/migrations/'));
if (schemaTouched && !migrationsTouched) v('Schema doc changed but no migration in supabase/migrations/');
if (migrationsTouched && !schemaTouched) v('Migration changed but docs/SCHEMA.md (or schema.md.txt) not updated');
if (!schemaTouched && !migrationsTouched) ok('No schema/migration changes detected');


// 4) Plugins must keep envelopes and structure
const pluginFiles = diffFiles.filter(f => f.startsWith('src/'));
if (pluginFiles.length) {
// 4a) envelope check in controllers
const controllerFiles = pluginFiles.filter(f => /src\/[^/]+\/controllers\/.+\.\w+$/.test(f));
for (const f of controllerFiles) {
const code = getFile(f);
// basic heuristic: look for reply.send({ ... }) and disallow reply.send([ ... ]) or reply.send(someVar) at top-level
const hasEnvelope = /reply\.(code\(\d+\)\.)?send\(\s*\{[\s\S]*\}\s*\)/.test(code);
const sendsArray = /reply\.(code\(\d+\)\.)?send\(\s*\[/.test(code);
if (!hasEnvelope || sendsArray) v(`Controller must return envelope in ${f}`);
}
if (controllerFiles.length) ok('Controllers present; envelope heuristic applied');


// 4b) service injection – forbid direct supabase client imports
const serviceFiles = pluginFiles.filter(f => /src\/[^/]+\/services\/.+\.\w+$/.test(f));
for (const f of serviceFiles) {
const code = getFile(f);
if (/from\s+['"]@?supabase\/.+['"]/i.test(code)) v(`Service must not import Supabase directly (receive via injection): ${f}`);
if (!/function\s+\w+\s*\(\s*supabase\s*[,)]/.test(code) && !/\(\s*supabase\s*[,)]/.test(code)) v(`Service functions should accept \`supabase\` as first param: ${f}`);
}
if (serviceFiles.length) ok('Services present; injection heuristic applied');


// 4c) schemas existence if routes/controllers added
const touchedPlugins = new Set(pluginFiles.map(f => f.split('/')[1]));
for (const p of touchedPlugins) {
const hasRoutes = diffFiles.some(f => f === `src/${p}/routes.js` || f === `src/${p}/routes.ts`);
const hasSchemas = exists(`src/${p}/schemas/${p}Schemas.js`) || exists(`src/${p}/schemas/${p}Schemas.ts`);
if (hasRoutes && !hasSchemas) v(`Plugin ${p} has routes changed but missing schemas file`);
}
}


// 5) Smoke workflow usage for previews (presence heuristic)
const usesSmokeReusable = diffFiles.some(f => f.startsWith('.github/workflows/') && /smoke-reusable\.yml$/.test(f))
|| sh(`git grep -n "smoke-reusable.yml" ${head} || true`).length > 0;
if (!usesSmokeReusable) v('Preview workflows should call .github/workflows/smoke-reusable.yml'); else ok('Smoke reusable referenced');


// 6) Workers: if workers/ changes, require a test under workers/**/test/
const workerChanged = diffFiles.some(f => f.startsWith('workers/'));
if (workerChanged) {
const hasTest = diffFiles.some(f => /workers\/.*\/test\/.*\.(test|spec)\.(mjs|js|ts)$/.test(f))
|| exists('workers/render/test') || exists('workers/*/test');
if (!hasTest) v('Worker changes require a Miniflare test under workers/**/test/*.test.*'); else ok('Worker test(s) present or unchanged');
} else ok('No worker changes detected');


// 7) Lint + typecheck are handled by separate jobs; this script only warns if configs missing
if (!exists('.eslintrc.js') && !exists('eslint.config.mjs') && !exists('.eslintrc.cjs')) report.push('ℹ️ ESLint config not found (skip)');


// Emit GitHub Actions output for sticky comment
const out = report.join('\n');
console.log(out);
// Also set an output variable (classic syntax for compat)
if (violations > 0) process.exit(1);
