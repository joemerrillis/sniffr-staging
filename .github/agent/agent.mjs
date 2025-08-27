#!/usr/bin/env node
/**
 * Sniffr Agent Runner (PLAN / APPLY)
 *
 * - --mode=plan  → writes:
 *     - .github/agent/.plan.md  (human preview)
 *     - .github/agent/PLAN.json (machine-readable for plan-lint)
 *   and prints the markdown to stdout (so your workflow keeps tee -> .plan.md)
 * - --mode=apply → prints strict JSON { summary, commitMessage, files:[...] }
 */

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '.github/agent';
const PLAN_MD = path.join(OUT_DIR, '.plan.md');
const PLAN_JSON = path.join(OUT_DIR, 'PLAN.json');

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function parseArgs(argv) {
  const args = { mode: 'plan' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const [k, v] = a.includes('=') ? a.split('=') : [a, argv[i + 1]];
    switch (k) {
      case '--mode': args.mode = v; if (!a.includes('=')) i++; break;
      case '--prompt-file': args.promptFile = v; if (!a.includes('=')) i++; break;
      default: /* ignore */ break;
    }
  }
  return args;
}

async function maybeOpenAI() {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || '';
  if (!key) return null;
  try {
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: key });
    return client;
  } catch {
    return null;
  }
}

function readPrompt(promptFile) {
  if (promptFile && exists(promptFile)) return read(promptFile);
  const buf = fs.readFileSync(0, 'utf8'); // stdin
  return buf.toString();
}

/* ---------------------- DEFAULT FALLBACKS (unchanged semantics) ---------------------- */

function defaultPlanMarkdown(prompt) {
  return `# Plan
- Analyze Constitution & Schema; identify required changes.
- Scaffold or modify plugin files as needed.
- Ensure controllers return envelopes and services use injected supabase param.
- Add/Update migrations and docs/SCHEMA.md if schema changes.
- Add/Update smoke tests and worker tests.

# Files
- <computed by APPLY>

# OpenAPI
- <paths to update or confirm>

# Migrations
- <filenames if schema changed>

# Smoke
- /health -> 200
- /docs/json -> 200
`;
}

function defaultPlanJSON(prompt, planMarkdown) {
  return {
    meta: {
      outputFormat: "PLAN(markdown) + APPLY(strict JSON)",
      cookieStrategy: "server-set" // safe default to satisfy FE constitution until specified
    },
    changes: [], // planner can fill these; linter will still run path-only checks if present
    planMarkdown
  };
}

function defaultApply(prompt) {
  return {
    summary: "No-op apply (fallback). Please configure OPENAI_API_KEY for real edits.",
    commitMessage: "chore: noop apply (agent fallback)",
    files: []
  };
}

/* ---------------------- OPENAI CALLS ---------------------- */

/** CHANGED: Plan returns strict JSON (with embedded planMarkdown). */
async function openaiPlanJSON(client, prompt) {
  const sys = `
You are Sniffr's code agent.

Return ONLY strict JSON in this shape (no markdown fences):
{
  "meta": {
    "outputFormat": "PLAN(markdown) + APPLY(strict JSON)",
    "cookieStrategy": "server-set" | "other?"
  },
  "changes": [
    {
      "path": "relative/path/from/repo/root",
      "type": "add|modify|delete",
      "meta": {
        "purpose": "frontend-login|backend-route|... (optional)",
        "responseEnvelopeKey": "auth|user|walk|..."  // required for backend routes/controllers
      }
      // "contents": "optional preview; not required at PLAN time"
    }
  ],
  "planMarkdown": "# Plan\\n- ... (human-readable plan preview)"
}
- "changes" should include intended files with correct paths (e.g., apps/web/src/app/(tenants)/[tenant]/login/page.tsx).
- For backend routes/controllers, include a responseEnvelopeKey in "meta".
- DO NOT include code blocks or backticks. DO NOT return anything except the JSON object.
`.trim();

  const res = await client.chat.completions.create({
    model: process.env.SNIFFR_AGENT_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  });

  const raw = (res.choices?.[0]?.message?.content || '').trim();
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    // As a safety net, if the model returned md: rewrap into JSON
    obj = defaultPlanJSON(prompt, raw || defaultPlanMarkdown(prompt));
  }
  // Ensure minimal fields
  if (!obj.planMarkdown) obj.planMarkdown = defaultPlanMarkdown(prompt);
  if (!obj.meta) obj.meta = { outputFormat: "PLAN(markdown) + APPLY(strict JSON)" };
  if (!Array.isArray(obj.changes)) obj.changes = [];
  return obj;
}

async function openaiApply(client, prompt) {
  const sys = `You are Sniffr's code agent. Respond ONLY with strict JSON in this shape:
{
  "summary": "...",
  "commitMessage": "...",
  "files": [{"path":"<relative path>","contents":"<string>"}]
}`;
  const res = await client.chat.completions.create({
    model: process.env.SNIFFR_AGENT_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  });
  return (res.choices?.[0]?.message?.content || '').trim();
}

/* ---------------------- MAIN ---------------------- */

async function main() {
  const args = parseArgs(process.argv);
  const prompt = readPrompt(args.promptFile);
  ensureDir(OUT_DIR);

  const client = await maybeOpenAI();

  if (args.mode === 'plan') {
    if (client) {
      // NEW: get strict JSON with both planMarkdown + changes[]
      const planObj = await openaiPlanJSON(client, prompt);

      // Write PLAN.json for the linter
      fs.writeFileSync(PLAN_JSON, JSON.stringify(planObj, null, 2), 'utf8');

      // Also write .plan.md for your existing preview/comment workflow
      fs.writeFileSync(PLAN_MD, String(planObj.planMarkdown || ''), 'utf8');

      // Keep stdout = markdown so your current workflow `tee .plan.md` still works
      process.stdout.write(String(planObj.planMarkdown || '') + '\n');
    } else {
      // Fallback: generate markdown + minimal JSON
      const md = defaultPlanMarkdown(prompt);
      const json = defaultPlanJSON(prompt, md);
      fs.writeFileSync(PLAN_JSON, JSON.stringify(json, null, 2), 'utf8');
      fs.writeFileSync(PLAN_MD, md, 'utf8');
      process.stdout.write(md + '\n');
    }
    return;
  }

  if (args.mode === 'apply') {
    if (client) {
      const out = await openaiApply(client, prompt);
      process.stdout.write(out + '\n');
    } else {
      process.stdout.write(JSON.stringify(defaultApply(prompt)) + '\n');
    }
    return;
  }

  console.error(`Unknown --mode ${args.mode}. Use --mode plan | apply`);
  process.exit(2);
}

main().catch(err => {
  console.error('agent fatal error:', err);
  process.exit(1);
});
