// tools/search-server.ts
// Hybrid search server: rg-based narrowing (if available) + SQLite + optional vector re-ranking.
// GET /health  -> { ok, vectors, rg }
// POST /index  -> { ok }
// GET /search?q=... -> { hits: [{ path, ord, snippet, score? }, ...] }

import Fastify from 'fastify';
import { openDb } from './sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PORT = Number(process.env.SEARCH_PORT || 7777);
const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const DB_FILE = path.join(ROOT, 'code-index.sqlite');

const app = Fastify({ logger: false });
let db: any;
let hasVectors = false;
let hasRg = false;

function bufToF32(buf: Buffer): Float32Array {
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Float32Array(ab);
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0; const n = Math.min(a.length, b.length);
  for (let i=0;i<n;i++){ const x=a[i], y=b[i]; dot+=x*y; na+=x*x; nb+=y*y; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function embedQuery(q: string): Promise<Float32Array | null> {
  const key = process.env.OPENAI_API_KEY; if (!key) return null;
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST', headers: { 'authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: q })
  });
  if (!res.ok) return null; const json: any = await res.json();
  return new Float32Array(json.data[0].embedding);
}

function rgCandidates(query: string): string[] {
  if (!hasRg) return [];
  const words = query.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  // simple OR regex; semantic rerank handles precision later
  const pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const r = spawnSync('rg', ['-n', '--no-heading', '-S', '-i', pattern, ROOT], { encoding: 'utf8' });
  if (r.status !== 0 && (r.stdout || '').trim() === '') return [];
  const files = new Set<string>();
  for (const line of r.stdout.split('\n')) {
    if (!line) continue;
    const file = line.split(':', 1)[0];
    if (!file) continue;
    const rel = path.relative(ROOT, file);
    // Ignore node_modules/.git etc.
    if (rel.startsWith('node_modules') || rel.startsWith('.git')) continue;
    files.add(rel);
  }
  return Array.from(files);
}

app.get('/health', async () => ({ ok: true, vectors: hasVectors, rg: hasRg }));

app.post('/index', async () => ({ ok: fs.existsSync(DB_FILE) }));

app.get('/search', async (req, _res) => {
  const raw = String((req.query as any).q || '').trim();
  if (!raw) return { hits: [] };

  let baseRows: any[] = [];

  const candidates = rgCandidates(raw);
  if (candidates.length) {
    const placeholders = candidates.map(() => '?').join(',');
    baseRows = await db.all(
      `SELECT id, path, ord, substr(text,1,500) AS snippet
         FROM chunks WHERE path IN (${placeholders}) LIMIT 800`,
      candidates
    );
  } else {
    // fallback: LIKE across terms and path
    const words = raw.split(/\s+/).filter(Boolean);
    const likeTerms = words.map(w => `%${w}%`);
    const clause = likeTerms.map(() => '(path LIKE ? OR text LIKE ?)').join(' AND ');
    const args = likeTerms.flatMap(t => [t, t]);
    baseRows = await db.all(
      `SELECT id, path, ord, substr(text,1,500) AS snippet FROM chunks
       WHERE ${clause} LIMIT 400`,
      args
    );
  }

  if (hasVectors && baseRows.length) {
    const qvec = await embedQuery(raw);
    if (qvec) {
      const ids = baseRows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const vecRows: any[] = await db.all(
        `SELECT c.id, c.path, c.ord, substr(c.text,1,500) AS snippet, v.vec
           FROM chunks c JOIN chunk_vec v ON v.id=c.id WHERE c.id IN (${placeholders})`,
        ids
      );
      const scored = vecRows.map(r => ({ path: r.path, ord: r.ord, snippet: r.snippet, score: cosine(qvec, bufToF32(r.vec)) }));
      scored.sort((a,b)=> (b.score! - a.score!));
      return { hits: scored.slice(0, 50) };
    }
  }

  return { hits: baseRows.slice(0, 50).map(({ id, ...rest }) => rest) };
});

async function start() {
  hasRg = spawnSync('rg', ['--version']).status === 0;
  db = await openDb(DB_FILE);
  const hasTable = await db.get('SELECT 1 AS ok FROM sqlite_master WHERE type="table" AND name="chunk_vec"');
  const row = hasTable ? await db.get('SELECT COUNT(*) AS n FROM chunk_vec') : { n: 0 };
  hasVectors = !!row && row.n > 0;
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`search-server on ${PORT}; vectors=${hasVectors}; rg=${hasRg}`);
}

start().catch(e => { console.error(e); process.exit(1); });
