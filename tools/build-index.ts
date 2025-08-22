import fs from 'node:fs';
import path from 'node:path';
import { openDb } from './sqlite';
import { chunkSource, Chunk } from './chunker';

const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const DB = path.join(ROOT, 'code-index.sqlite');

const INCLUDED = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const EXCLUDE_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage']);

function listFiles(dir: string, out: string[] = []) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(p, out);
    else if (INCLUDED.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

async function embedBatch(texts: string[]): Promise<Float32Array[] | null> {
  const key = process.env.OPENAI_API_KEY; if (!key) return null;
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts })
  });
  if (!res.ok) throw new Error(`embed failed: ${res.status}`);
  const j: any = await res.json();
  return j.data.map((d: any) => new Float32Array(d.embedding));
}

async function main() {
  const files = listFiles(ROOT);
  console.log(`Indexing ${files.length} files…`);

  const db = await openDb(DB);
  await db.exec(`
    PRAGMA journal_mode=WAL;
    DROP TABLE IF EXISTS chunk_vec;
    DROP TABLE IF EXISTS chunks;
    CREATE TABLE chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      ord INTEGER NOT NULL,
      text TEXT NOT NULL
    );
    CREATE TABLE chunk_vec (
      id INTEGER PRIMARY KEY,
      vec BLOB NOT NULL
    );
  `);

  // Build chunks
  let total = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const chunks: Chunk[] = await chunkSource(path.relative(ROOT, f), src);
    if (chunks.length === 0) continue;
    const stmt = await db.prepare('INSERT INTO chunks(path, ord, text) VALUES (?,?,?)');
    try {
      await db.exec('BEGIN');
      for (const c of chunks) {
        await stmt.run(c.path, c.ord, c.text);
        total++;
      }
      await db.exec('COMMIT');
    } catch (e) {
      await db.exec('ROLLBACK'); throw e;
    } finally {
      await stmt.finalize();
    }
  }
  console.log(`wrote ${total} chunks`);

  // Embeddings (optional)
  if (process.env.OPENAI_API_KEY) {
    console.log('creating vectors…');
    const rows = await db.all('SELECT id, text FROM chunks');
    const BATCH = 64;
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH);
      const vecs = await embedBatch(slice.map((r: any) => r.text));
      if (!vecs) break;
      const stmt = await db.prepare('INSERT INTO chunk_vec(id, vec) VALUES (?, ?)');
      try {
        await db.exec('BEGIN');
        for (let k = 0; k < slice.length; k++) {
          const r = slice[k];
          const v = vecs[k];
          const buf = Buffer.from(v.buffer, v.byteOffset, v.byteLength);
          await stmt.run(r.id, buf);
        }
        await db.exec('COMMIT');
      } catch (e) {
        await db.exec('ROLLBACK'); throw e;
      } finally {
        await stmt.finalize();
      }
      process.stdout.write('.');
    }
    process.stdout.write('\n');
  } else {
    console.log('OPENAI_API_KEY not set; skipping embeddings');
  }

  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
