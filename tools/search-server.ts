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
  const terms = q.split(/\s+/).map(t => `%${t}%`);
  const placeholders = terms.map(() => 'text LIKE ?').join(' AND ');
  const rows = await db.all(`
    SELECT path, ord, substr(text,1,500) AS snippet
    FROM chunks
    WHERE ${placeholders}
    LIMIT 50
  `, terms);
  return { hits: rows };
});

app.get('/health', async () => ({ ok: true }));

async function start() {
  db = await openDb(DB_FILE);
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`search-server listening on ${PORT}`);
}

start().catch(e => { console.error(e); process.exit(1); });
