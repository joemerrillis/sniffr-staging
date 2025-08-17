// tools/search-server.ts
// Fastify server exposing /index and /search over the SQLite index
import Fastify from 'fastify';
import { openDb } from './sqlite';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.SEARCH_PORT || 7777);
const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const DB_FILE = path.join(ROOT, 'code-index.sqlite');

const app = Fastify();
let db: any;

app.post('/index', async (_req, _res) => {
  // In CI, run tools/build-index.ts separately before starting this server.
  return { ok: fs.existsSync(DB_FILE) };
});

app.get('/search', async (req, _res) => {
  const q = String((req.query as any).q || '').trim();
  if (!q) return { hits: [] };

  // 1) Keyword hits
  const terms = q.split(/\s+/).map(t => `%${t}%`);
  const placeholders = terms.map(() => 'text LIKE ?').join(' AND ');
  const kw = await db.all(
    `SELECT id, path, ord, substr(text,1,500) AS snippet
     FROM chunks WHERE ${placeholders} LIMIT 100`, terms
  );

  // 2) Vector hits if available
  let vecHits: any[] = [];
  if (process.env.OPENAI_API_KEY) {
    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: q })
    });
    if (embRes.ok) {
      const { data } = await embRes.json();
      const qVec = new Float32Array(data[0].embedding);
      // Pull a candidate pool (cheap) and cosine-score in JS
      const rows = await db.all(`SELECT c.id, c.path, c.ord, substr(c.text,1,500) AS snippet, v.vec
                                 FROM chunks c JOIN chunk_vec v ON v.id = c.id LIMIT 1000`);
      vecHits = rows.map((r: any) => {
        const v = new Float32Array(Buffer.from(r.vec).buffer);
        let dot = 0, nq = 0, nv = 0;
        for (let i=0;i<qVec.length;i++) { dot += qVec[i]*v[i]; nq += qVec[i]*qVec[i]; nv += v[i]*v[i]; }
        const cos = dot / (Math.sqrt(nq)*Math.sqrt(nv));
        return { ...r, vscore: cos };
      }).sort((a,b) => b.vscore - a.vscore).slice(0, 100);
    }
  }

  // 3) Fuse (simple: max of normalized ranks)
  const byId: Record<string, any> = {};
  kw.forEach((r: any, i: number) => { const k = String(r.id); byId[k] = { ...r, kscore: 1 - i/kw.length, vscore: 0 }; });
  vecHits.forEach((r: any, i: number) => {
    const k = String(r.id);
    const vscore = 1 - i/vecHits.length;
    byId[k] = byId[k] ? { ...byId[k], vscore } : { ...r, kscore: 0, vscore };
  });

  const fused = Object.values(byId)
    .map((r: any) => ({ ...r, score: Math.max(r.kscore ?? 0, r.vscore ?? 0) }))
    .sort((a:any,b:any) => b.score - a.score)
    .slice(0, 50);

  return { hits: fused };
});


app.get('/health', async () => ({ ok: true }));

async function start() {
  db = await openDb(DB_FILE);
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`search-server listening on ${PORT}`);
}

start().catch(e => { console.error(e); process.exit(1); });
