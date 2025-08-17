// tools/fetch-context.mjs
// Query the local search-server with a derived query; write .github/agent/.context.json
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const OUT = path.join(ROOT, '.github/agent/.context.json');
const Q = process.env.REQUEST_TEXT || '';
const host = process.env.SEARCH_HOST || 'http://127.0.0.1:7777';

const terms = Q.split(/[^a-zA-Z0-9_]+/).filter(w => w.length > 2).slice(0, 8).join(' ');
const url = `${host}/search?q=${encodeURIComponent(terms)}`;

const res = await fetch(url);
if (!res.ok) throw new Error('search failed');
const { hits } = await res.json();

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ query: terms, hits }, null, 2));
console.log(`context → ${OUT} (${hits.length} hits)`);
