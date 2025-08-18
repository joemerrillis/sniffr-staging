// tools/search-server.ts
// Hybrid search: keyword + semantic (cosine) when vectors exist.
// Uses OPENAI_API_KEY at runtime to embed the query only (index already holds vectors).
import Fastify from 'fastify';
import { openDb } from './sqlite';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.SEARCH_PORT || 7777);
const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const DB_FILE = path.join(ROOT, 'code-index.sqlite');

const app = Fastify({ logger: false });
let db: any;
let hasVectors = false;

function bufToF32(buf: Buffer): Float32Array {
  // sqlite returns Buffer; convert to Float32Array without copying
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    const x = a[i], y = b[i];
    dot += x * y; na += x * x; nb += y * y;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function embedQuery(q: string): Promise<Float32Array | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: q })
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  return new Float32Array(json.data[0].embedding);
}

app.get('/health', async () => ({ ok: true, vectors: hasVectors }));

app.post('/index', async () => ({ ok: fs.existsSync(DB_FILE) }));

app.get('/search', async (req, _res) => {
  const raw = String((req.query as any).q || '').trim();
  if (!raw) return { hits: [] };

  const words = raw.split(/\s+/).filter(Boolean);
  const likeTerms = words.map(w => `%${w}%`);
  const likeClause = likeTerms.map(() => 'c.text LIKE ?').join(' AND ');

  // First, narrow with keyword search (fast, indexed by LIKE on small sets)
  const baseRows: any[] = await db.all(
    `
    SELECT c.id, c.path, c.ord, substr(c.text,1,500) AS snippet
    FROM chunks c
    WHERE ${likeClause}
    LIMIT 400
    `,
    likeTerms
  );

  // If we have vectors and a key, re-rank semantically
  if (hasVectors) {
    const qvec = await embedQuery(raw);
    if (qvec) {
      // Pull vectors for the candidate set only
      const ids = baseRows.map(r => r.id);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        const vecRows: any[] = await db.all(
          `SELECT c.id, c.path, c.ord, substr(c.text,1,500) AS snippet, v.vec
           FROM chunks c JOIN chunk_vec v ON v.id = c.id
           WHERE c.id IN (${placeholders})`,
          ids
        );
        const scored = vecRows.map(r => ({
          path: r.path,
          ord: r.ord,
          snippet: r.snippet,
          score: cosine(qvec, bufToF32(r.vec))
        }));
        scored.sort((a, b) => b.score - a.score);
        return { hits: scored.slice(0, 50) };
      }
    }
  }

  // Fallback: keyword-only
  return { hits: baseRows.slice(0, 50) };
});

async function start() {
  db = await openDb(DB_FILE);
  const row = await db.get('SELECT COUNT(*) AS n FROM sqlite_master WHERE type="table" AND name="chunk_vec"');
  const cnt = await db.get('SELECT COUNT(*) AS n FROM chunk_vec').catch(() => ({ n: 0 }));
  hasVectors = !!row?.n && (cnt?.n || 0) > 0;
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`search-server listening on ${PORT}; vectors=${hasVectors}`);
}

start().catch(e => { console.error(e); process.exit(1); });
