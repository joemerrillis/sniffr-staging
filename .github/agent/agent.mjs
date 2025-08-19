#!/usr/bin/env node
/**
 * Sniffr Agent Runner (PLAN / APPLY)
 *
 * This is a thin, pluggable wrapper around an LLM.
 * - Reads prompt from STDIN (or --prompt-file)
 * - --mode=plan  → returns Markdown PLAN
 * - --mode=apply → returns strict JSON { summary, commitMessage, files:[{path,contents}] }
 *
 * If OPENAI is available (OPENAI_API_KEY + 'openai' npm pkg), it will call the API.
 * Otherwise it will emit conservative stubs (so CI doesn't explode locally).
 */

import fs from 'node:fs';
import path from 'node:path';

function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function read(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
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
  // Read from stdin
  const buf = fs.readFileSync(0, 'utf8');
  return buf.toString();
}

function defaultPlan(prompt) {
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

function defaultApply(prompt) {
  // Minimal no-op commit to keep pipelines flowing if no LLM configured
  return {
    summary: "No-op apply (fallback). Please configure OPENAI_API_KEY for real edits.",
    commitMessage: "chore: noop apply (agent fallback)",
    files: []
  };
}

async function openaiPlan(client, prompt) {
  const sys = `You are Sniffr's code agent. Respond ONLY with the PLAN markdown section as specified by the Constitution.`;
  const res = await client.chat.completions.create({
    model: process.env.SNIFFR_AGENT_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
  });
  return (res.choices?.[0]?.message?.content || '').trim();
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

async function main() {
  const args = parseArgs(process.argv);
  const prompt = readPrompt(args.promptFile);

  const client = await maybeOpenAI();

  if (args.mode === 'plan') {
    if (client) {
      const out = await openaiPlan(client, prompt);
      process.stdout.write(out + '\n');
    } else {
      process.stdout.write(defaultPlan(prompt) + '\n');
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

  // Unknown mode
  console.error(`Unknown --mode ${args.mode}. Use --mode plan | apply`);
  process.exit(2);
}

main().catch(err => {
  console.error('agent fatal error:', err);
  process.exit(1);
});
