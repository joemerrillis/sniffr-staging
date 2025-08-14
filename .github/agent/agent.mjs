import { Octokit } from "@octokit/rest";
import OpenAI from "openai";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const MODE = (process.env.MODE || "plan").toLowerCase();   // "plan" | "revise" | "apply"
const REQUEST_TEXT = process.env.REQUEST_TEXT || "";

// GitHub context
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const baseBranch = process.env.GITHUB_BASE_REF || "main";
const gh = new Octokit({ auth: process.env.GH_TOKEN });

// OpenAI
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.AGENT_MODEL || "gpt-5";


// Utility: set output for later steps
function setOutput(key, val) {
  const out = process.env.GITHUB_OUTPUT;
  if (out) writeFileSync(out, `${key}=${val}\n`, { flag: "a" });
}

// === Context loading (lightweight, curated) ===
function safeRead(p, max = 12000) {
  try {
    const s = readFileSync(p, "utf8");
    return s.length > max ? s.slice(0, max) + "\n\n... [truncated]" : s;
  } catch { return ""; }
}

function gatherContext() {
  const ctx = [];
  const add = (label, rel) => {
    const full = path.join(process.cwd(), rel);
    if (existsSync(full)) {
      const txt = safeRead(full);
      if (txt) ctx.push(`--- ${label} (${rel}) ---\n${txt}`);
    }
  };
  add("CONTEXT", "docs/CONTEXT.md");
  add("SCHEMA", "docs/SCHEMA.md");
  add("ROUTING", "docs/ROUTING.md");
  add("TESTING", "docs/TESTING.md");
  add("package.json", "package.json");
  add("Fastify entry", "index.js");
  add("OpenAPI RapiDoc", "public/rapi-doc/rapidoc.html");
  add("Swagger setup", "src/swagger.js");
  return ctx.join("\n\n");
}

// === System prompts ===
const sysPlanner = `
You are the PLANNER for the Sniffr repo.
Read the project context and propose a concrete plan that matches house style.

RETURN STRICT MARKDOWN ONLY:
# Plan
- short bullets of tasks

# Files
- list each <path>: purpose

# OpenAPI
- paths you will add/change (YAML-like)

# Migrations (if any)
- name using UTC: YYYYMMDDHHMMSS_name.sql and a matching _down.sql
- describe the change

# Smoke
- endpoints to hit and expected status codes

Never write or change files in PLAN mode.
`;

const sysExecutor = `
You are the EXECUTOR for the Sniffr repo.

When asked to APPLY, output STRICT JSON:

{
  "summary": "one-line summary",
  "commitMessage": "imperative commit message",
  "files": [
    {"path":"<relative path>", "contents":"<file contents>"}
  ]
}

Rules:
- Minimal, non-breaking changes by default.
- If unsure of layout, create a minimal Fastify plugin at src/agent_sanity/routes.js registering GET /_agent/health returning {"ok":true}.
- Add/extend OpenAPI so /docs/json includes new paths.
- Add docs/AGENT_NOTES.md explaining what was added and how to test.
- For migrations: always add a matching *_down.sql.
`;

const sysReviewer = `
You are the REVIEWER. You will receive a unified git diff and short repo context.
Find issues: missing imports, unregistered plugins, wrong OpenAPI, missing *_down.sql, bad timestamps, invalid JS.
If fixes are needed, return STRICT JSON:

{
  "fixes": [
    {"path":"<file>", "contents":"<full corrected file>"}
  ],
  "notes": "short list of what you corrected"
}

If nothing to fix, return: {"fixes":[],"notes":"looks good"}.
`;

// === Main modes ===
async function runPlan() {
  const ctx = gatherContext();
  const messages = [
    { role: "system", content: sysPlanner },
    { role: "user", content: `## Project Context\n${ctx}\n\n## Request\n${REQUEST_TEXT}` },
  ];
  const res = await ai.chat.completions.create({
    model: MODEL,
    messages,
  });
  const plan = res.choices[0].message.content || "No plan generated.";
  const planPath = ".github/agent/.plan.md";
  mkdirSync(".github/agent", { recursive: true });
  writeFileSync(planPath, plan, "utf8");
  setOutput("plan_path", planPath);
}

async function runApply() {
  // 1) Generate files
  const ctx = gatherContext();
  const messages = [
    { role: "system", content: sysExecutor },
    { role: "user", content: `## Project Context\n${ctx}\n\n## Implement\n${REQUEST_TEXT}` },
  ];
  const completion = await ai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages,
  });

  const out = JSON.parse(completion.choices[0].message.content || "{}");
  const summary = out.summary || "Agent proposal";
  const commitMessage = out.commitMessage || "agent: apply proposal";
  const files = Array.isArray(out.files) ? out.files : [];

  // 2) Create branch, write files, commit, push (Draft PR)
  const newBranch = `agent/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  execSync(`git config user.email "bot@sniffr.dev"`);
  execSync(`git config user.name "sniffr-agent"`);
  execSync(`git checkout -b ${newBranch}`, { stdio: "inherit" });

  for (const f of files) {
    const full = path.join(process.cwd(), f.path);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, f.contents ?? "", "utf8");
  }

  execSync("git add -A", { stdio: "inherit" });
  execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
  execSync(`git push origin ${newBranch}`, { stdio: "inherit" });

  const pr = await gh.pulls.create({
    owner, repo,
    title: commitMessage,
    head: newBranch,
    base: baseBranch,
    body: `### Summary\n${summary}\n\n_Auto-generated._`,
    draft: true
  });

  // 3) Reviewer pass (self‑review + possible patch commit)
  try {
    const diff = execSync(`git --no-pager diff origin/${baseBranch}...origin/${newBranch}`, { encoding: "utf8" });
    const revMsgs = [
      { role: "system", content: sysReviewer },
      { role: "user", content: `## Minimal Context\n${ctx.slice(0, 8000)}\n\n## Diff\n${diff}` },
    ];
    const r = await ai.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: revMsgs,
    });
    const review = JSON.parse(r.choices[0].message.content || '{"fixes":[],"notes":""}');
    if (Array.isArray(review.fixes) && review.fixes.length) {
      // Checkout branch locally for patch commit
      execSync(`git fetch origin ${newBranch}`);
      execSync(`git checkout ${newBranch}`);
      for (const fix of review.fixes) {
        const full = path.join(process.cwd(), fix.path);
        mkdirSync(path.dirname(full), { recursive: true });
        writeFileSync(full, fix.contents ?? "", "utf8");
      }
      execSync("git add -A");
      execSync(`git commit -m "agent: reviewer fixes"`);
      execSync(`git push origin ${newBranch}`);
      // Append reviewer notes to PR
      if (review.notes) {
        await gh.issues.createComment({ owner, repo, issue_number: pr.data.number, body: `🤖 Reviewer notes:\n\n${review.notes}` });
      }
    }
  } catch (e) {
    // Non-blocking; just comment error
    await gh.issues.createComment({ owner, repo, issue_number: pr.data.number, body: `Reviewer pass error (non-blocking): \`${e.message}\`` });
  }

  // 4) Output PR URL
  setOutput("pr_url", pr.data.html_url);
}

(async () => {
  try {
    if (MODE === "plan" || MODE === "revise") {
      await runPlan();
    } else if (MODE === "apply") {
      await runApply();
    } else {
      await runPlan();
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
