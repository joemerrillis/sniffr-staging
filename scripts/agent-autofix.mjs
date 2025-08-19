#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';


const MAX_ITERS = parseInt(process.env.MAX_ITERS || '2', 10);
const VIOL = path.join('.github', '.constitution', 'violations.json');


function read(p){ return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; }
function sh(cmd){ return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }); }


// Canon files the agent must always read
const canon = {
context: read('docs/CONTEXT.md') || read('CONTEXT.md'),
schema: read('docs/SCHEMA.md') || read('schema.md.txt'),
gotchas: read('sniffr_plugin_gotchas.md') || read('sniffr_plugin_gotchas.md.txt'),
constitution: read('CONSTITUTION.md') || read('.github/agent/CONSTITUTION.md'),
};


const violations = JSON.parse(read(VIOL) || '{"violations":[]}').violations || [];
if (!violations.length) {
console.log('No violations to auto-fix.');
process.stdout.write(`::set-output name=did_change::false`);
process.stdout.write(`::set-output name=iterations::0`);
process.exit(0);
}


function buildPrompt(vs){
const bulletList = vs.map(v => `- [${v.code}] ${v.message}`).join('\n');
return `You are Sniffr's code agent. Fix the repo to satisfy ALL rules.\n\nViolations to fix:\n${bulletList}\n\nFollow these documents exactly (do not invent fields):\n--- CONTEXT.md ---\n${canon.context}\n--- SCHEMA.md ---\n${canon.schema}\n--- GOTCHAS ---\n${canon.gotchas}\n--- CONSTITUTION ---\n${canon.constitution}\n\nOUTPUT MODES:\n1) PLAN: Markdown bullets of changes, list of files, migrations, OpenAPI, smoke.\n2) APPLY: Strict JSON with files: [{path, contents}], commitMessage.\n`;
}


// Wire to your existing agent runner
function runAgentOnce(prompt){
// If you have a CLI like: node .github/agent/agent.mjs --mode plan/apply
// Replace the two sh() calls accordingly.
const plan = sh(`node .github/agent/agent.mjs --mode plan << 'EOF'\n${prompt}\nEOF`);
const apply = sh(`node .github/agent/agent.mjs --mode apply << 'EOF'\n${prompt}\nEOF`);
// Optionally parse and write files if your apply mode only prints JSON
try {
const data = JSON.parse(apply);
if (Array.isArray(data.files)) {
for (const f of data.files) {
fs.mkdirSync(path.dirname(f.path), { recursive: true });
fs.writeFileSync(f.path, f.contents);
}
// Stage but do not commit yet; let CI step commit
sh('git add -A');
return true;
}
} catch (e) {
console.error('Apply JSON parse error:', e.message);
}
return false;
}


let changed = false;
let iters = 0;
for (; iters < MAX_ITERS; iters++) {
const prompt = buildPrompt(violations);
const did = runAgentOnce(prompt);
if (!did) break;


// quick local checks (no network):
try { sh('node scripts/constitution-check.mjs'); } catch { /* still failing; iterate */ }


changed = true;
}


process.stdout.write(`::set-output name=did_change::${changed ? 'true' : 'false'}`);
process.stdout.write(`::set-output name=iterations::${iters}`);
