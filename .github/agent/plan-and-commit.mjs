#!/usr/bin/env node
/**
 * Sniffr - plan → apply → test → constitution → (auto-fix loop)
 *
 * Usage examples:
 *   node .github/agent/plan-and-commit.mjs --task "Add dog_events plugin" --tests "npm test" --maxIters 3
 *   node .github/agent/plan-and-commit.mjs --prompt-file .github/.constitution/prompt.md --tests "npm run smoke"
 *
 * Behavior:
 *  - Build the agent prompt from --prompt-file OR assemble from canon docs + --task
 *  - Run agent in PLAN mode (capture to .github/.agent/plan.md)
 *  - Run agent in APPLY mode (expect strict JSON with files[{path,contents}], commitMessage)
 *  - Write files to disk (no commit here; let CI or caller decide)
 *  - Run constitution-check; if violations -> append to prompt and iterate (maxIters)
 *  - Optionally run tests command; on fail -> append summary and iterate
 *  - Exit 0 on success; nonzero if still failing after maxIters
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import os from 'node:os';

const CWD = process.cwd();
const AGENT_BIN = path.join('.github', 'agent', 'agent.mjs');
const CHECK_BIN = path.join('scripts', 'constitution-check.mjs');
const AGENT_OUT_DIR = path.join('.github', '.agent');

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8', ...opts }).trim();
}
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
function write(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const [k, v] = a.includes('=') ? a.split('=') : [a, argv[i + 1]];
    switch (k) {
      case '--task': args.task = v; if (!a.includes('=')) i++; break;
      case '--prompt-file': args.promptFile = v; if (!a.includes('=')) i++; break;
      case '--tests': args.tests = v; if (!a.includes('=')) i++; break;
      case '--maxIters': args.maxIters = parseInt(v, 10); if (!a.includes('=')) i++; break;
      case '--planOnly': args.planOnly = true; break;
      case '--applyOnly': args.applyOnly = true; break;
      default: /* ignore unknown */ break;
    }
  }
  if (!args.maxIters || Number.isNaN(args.maxIters)) args.maxIters = 2;
  return args;
}

function buildCanonPrompt(taskText) {
  const constitution = read('CONSTITUTION.md') || read('.github/agent/CONSTITUTION.md');
  const context = read('docs/CONTEXT.md') || read('CONTEXT.md');
  const schema = read('docs/SCHEMA.md') || read('schema.md.txt');
  const gotchas = read('sniffr_plugin_gotchas.md') || read('sniffr_plugin_gotchas.md.txt');

  const header = taskText ? `## TASK\n${taskText}\n\n` : '';
  return `${header}You are Sniffr's code agent. Follow the Constitution strictly.

--- CONSTITUTION.md ---
${constitution}

--- CONTEXT.md ---
${context}

--- SCHEMA.md ---
${schema}

--- SNIFFR_PLUGIN_GOTCHAS.md ---
${gotchas}

OUTPUT MODES:
1) PLAN (Markdown): bullets of changes, affected files, migrations, OpenAPI, smoke.
2) APPLY (strict JSON): { summary, commitMessage, files:[{path,contents}] }.

Rules:
- Controllers must return envelopes; no naked arrays/objects.
- Services must accept injected "supabase" param; do not import supabase clients directly.
- Schema changes require matching migrations & schema docs updates.
- Preview workflows should call smoke-reusable.yml.
- Worker changes require a Miniflare test under workers/**/test.
`;
}

function runAgent(mode, prompt) {
  if (!exists(AGENT_BIN)) throw new Error(`Agent binary not found at ${AGENT_BIN}`);
  const proc = spawnSync('node', [AGENT_BIN, '--mode', mode], {
    input: prompt,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (proc.error) throw proc.error;
  const out = proc.stdout || '';
  const err = proc.stderr || '';
  if (proc.status !== 0) {
    throw new Error(`agent exited with ${proc.status}: ${err || out}`);
  }
  return out.trim();
}

function extractJson(s) {
  // Try whole string; then try to extract from a code fence; finally try first {...} block
  try { return JSON.parse(s); } catch {}
  const fence = s.match(/```json\s*([\s\S]+?)```/i) || s.match(/```([\s\S]+?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1]); } catch {}
  }
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const maybe = s.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(maybe); } catch {}
  }
  return null;
}

function applyFiles(files) {
  if (!Array.isArray(files)) return 0;
  let count = 0;
  for (const f of files) {
    if (!f || !f.path) continue;
    const p = f.path.replace(/\\/g, '/').replace(/^\.\//, '');
    write(p, f.contents ?? '');
    count++;
  }
  return count;
}

function runConstitutionCheck() {
  if (!exists(CHECK_BIN)) {
    console.warn(`⚠️  ${CHECK_BIN} not found; skipping constitution check.`);
    return { ok: true, report: 'skipped' };
  }
  try {
    const out = sh(`node ${CHECK_BIN}`);
    return { ok: true, report: out };
  } catch (e) {
    // constitution-check writes a human report to stdout when failing too
    const out = (e.stdout || e.message || '').toString();
    return { ok: false, report: out };
  }
}

function runTests(cmd) {
  if (!cmd) return { ok: true, report: 'no tests command provided' };
  try {
    const out = sh(cmd, { env: process.env });
    return { ok: true, report: out };
  } catch (e) {
    return { ok: false, report: (e.stdout || e.stderr || e.message || '').toString() };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(AGENT_OUT_DIR, { recursive: true });

  let prompt = '';
  if (args.promptFile && exists(args.promptFile)) {
    prompt = read(args.promptFile);
  } else {
    prompt = buildCanonPrompt(args.task || '');
  }

  // PLAN
  const plan = runAgent('plan', prompt);
  write(path.join(AGENT_OUT_DIR, 'plan.md'), plan);
  console.log('\n--- AGENT PLAN ---\n' + plan + '\n-------------------\n');

  if (args.planOnly) process.exit(0);

  let iters = 0;
  let lastViolationSummary = '';

  while (true) {
    iters++;
    // APPLY
    const applyOut = runAgent('apply', prompt);
    const data = extractJson(applyOut);
    if (!data || !Array.isArray(data.files)) {
      console.error('❌ Agent APPLY did not return valid JSON with a "files" array.\nRaw output:\n', applyOut);
      process.exit(2);
    }
    const written = applyFiles(data.files);
    write(path.join(AGENT_OUT_DIR, `apply-${Date.now()}.json`), JSON.stringify(data, null, 2));
    console.log(`📝 Wrote ${written} file(s) from agent APPLY`);

    if (args.applyOnly) process.exit(0);

    // Tests (optional)
    const testRes = runTests(args.tests);
    if (!testRes.ok) {
      console.log('❌ Tests failed. Adding summary to prompt and iterating.');
      lastViolationSummary = `\n\n### TEST FAILURES\n\`\`\`\n${testRes.report.slice(0, 2000)}\n\`\`\`\n`;
      prompt += `\n\n${lastViolationSummary}\nFix the tests.`;
    } else {
      console.log('✅ Tests passed (or skipped).');
    }

    // Constitution Check
    const check = runConstitutionCheck();
    write(path.join(AGENT_OUT_DIR, `constitution-${Date.now()}.log`), check.report || '');
    if (!check.ok) {
      console.log('❌ Constitution violations found. Adding summary to prompt and iterating.');
      lastViolationSummary = `\n\n### CONSTITUTION VIOLATIONS\n${check.report}\n`;
      prompt += `\n\n${lastViolationSummary}\nFix ALL violations exactly as described above.`;
    }

    // Exit conditions
    if (check.ok && testRes.ok) {
      console.log('🎉 All checks passed.');
      break;
    }
    if (iters >= args.maxIters) {
      console.error(`❌ Still failing after ${iters} iteration(s). See ${AGENT_OUT_DIR} artifacts for details.`);
      process.exit(1);
    }

    console.log(`↻ Iteration ${iters}/${args.maxIters} complete — retrying with updated prompt…\n`);
  }

  // Done
  process.exit(0);
}

main().catch(err => {
  console.error('plan-and-commit fatal error:', err);
  process.exit(1);
});
