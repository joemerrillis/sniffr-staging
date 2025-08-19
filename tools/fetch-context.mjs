// tools/fetch-context.mjs
// Build a query for the local search server; prefer an explicit "Context words:" line.
// Writes .github/agent/.context.json = { query, hits }
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const OUT = path.join(ROOT, '.github/agent/.context.json');
const Q = process.env.REQUEST_TEXT || '';
const host = process.env.SEARCH_HOST || 'http://127.0.0.1:7777';

let terms = [];
const m = Q.match(/Context\s+words:\s*([^\n]+)/i);
if (m) {
  terms = m[1].split(/[ ,\t]+/).filter(w => w.length > 1);
} else {
  // Keep path-ish tokens like src/routes, .ts, etc.
  terms = Q.split(/[^a-zA-Z0-9/_\.-]+/).filter(w => w.length > 2);
}
const query = terms.slice(0, 12).join(' ');
const url = `${host}/search?q=${encodeURIComponent(query)}`;

const res = await fetch(url);
if (!res.ok) throw new Error(`search failed: ${res.status}`);
const { hits } = await res.json();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ query, hits }, null, 2));
console.log(`context → ${OUT} (${hits.length} hits)`);
