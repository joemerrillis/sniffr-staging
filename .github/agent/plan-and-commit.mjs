import { Octokit } from "@octokit/rest";
import OpenAI from "openai";
import { writeFileSync, mkdirSync, appendFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const readStdin = () =>
  new Promise((res) => {
    let s = "";
    process.stdin.on("data", (d) => (s += d.toString()));
    process.stdin.on("end", () => res(s.trim()));
  });

const requestText = await readStdin();

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const baseBranch = process.env.GITHUB_BASE_REF || "main";
const newBranch = `agent/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const gh = new Octokit({ auth: process.env.GH_TOKEN });
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sysPrompt = `
You are the repo editor for Sniffr.
When asked to "create a plugin", output STRICT JSON:

{
  "summary": "one-line summary",
  "commitMessage": "imperative commit message",
  "files": [
    {"path":"<relative path>", "contents":"<file contents>"}
  ]
}

Rules:
- Prefer small, non-breaking changes.
- If unsure of project layout, create a minimal Fastify plugin at src/agent_sanity/routes.js that registers GET /_agent/health returning {ok:true}.
- Add minimal OpenAPI path (if repo lacks swagger, include a TODO comment).
- Include a README snippet at docs/AGENT_NOTES.md explaining what was added and how to test.
- Only create a few safe files; do not delete or modify existing files in this first run.
`;

const userPrompt = `User request:\n${requestText}`;

const completion = await ai.chat.completions.create({
  model: "gpt-4.1-mini",
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: sysPrompt },
    { role: "user", content: userPrompt }
  ],
});

const out = JSON.parse(completion.choices[0].message.content || "{}");
if (!out.files || !Array.isArray(out.files) || out.files.length === 0) {
  throw new Error("Agent returned no files to write.");
}

// Create branch, write files, commit, push, PR
execSync(`git checkout -b ${newBranch}`, { stdio: "inherit" });

for (const f of out.files) {
  const full = path.join(process.cwd(), f.path);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, f.contents ?? "", "utf8");
}

for (const f of out.files) {
  execSync(`git add -- "${f.path}"`, { stdio: "inherit" });
}
execSync(`git commit -m "${out.commitMessage || "agent: add files"}"`, { stdio: "inherit" });
execSync(`git push origin ${newBranch}`, { stdio: "inherit" });

const pr = await gh.pulls.create({
  owner, repo,
  title: out.commitMessage || "Agent: proposal",
  head: newBranch,
  base: baseBranch,
  body: `### Summary\n${out.summary || "Agent proposal"}\n\nAuto-generated.`,
});

// Output PR URL for later workflow steps
appendFileSync(process.env.GITHUB_OUTPUT, `pr_url=${pr.data.html_url}\n`);
