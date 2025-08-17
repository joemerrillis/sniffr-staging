// tools/build-index.ts
// Build a local code index into SQLite: chunks + optional embeddings via OpenAI
// - Runs in CI for PRs and on main
// - If OPENAI_API_KEY is present, stores embeddings (float32) to enable semantic search

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { openDb, ensureSchema, upsertChunkBatch } from './sqlite';

const ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const OUT = path.join(ROOT, 'code-index.sqlite');
const INCLUDE = [
  'src', 'apps', 'worker', 'tools', 'package.json', 'README.md', 'docs'
];
const EXTS = new Set(['.js','.mjs','.ts','.tsx','.json','.md','.yaml','.yml']);

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
      yield* walk(p);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXTS.has(ext)) yield p;
    }
  }
}

function chunk(text: string, size = 512, overlap = 64) {
  const tokens = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i=0;i<tokens.length;i+= (size - overlap)) {
    chunks.push(tokens.slice(i, i+size).join(' '));
  }
  return chunks;
}

async function embedBatch(chunks: string[]): Promise<Float32Array[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [] as any;
  const body = { model: 'text-embedding-3-small', input: chunks };
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Embedding error');
  const json: any = await res.json();
  return json.data.map((d: any) => new Float32Array(d.embedding));
}

async function main() {
  const db = await openDb(OUT);
  await ensureSchema(db);

  const files: string[] = [];
  for (const inc of INCLUDE) {
    const p = path.join(ROOT, inc);
    if (fs.existsSync(p)) {
      if (fs.statSync(p).isDirectory()) {
        for await (const f of walk(p)) files.push(f);
      } else files.push(p);
    }
  }

  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const text = fs.readFileSync(f, 'utf8');
    const parts = chunk(text);
    let vecs: Float32Array[] = [];
    if (process.env.OPENAI_API_KEY) {
      const BATCH = 64;
      for (let i=0;i<parts.length;i+=BATCH) {
        const slice = parts.slice(i, i+BATCH);
        const embeds = await embedBatch(slice);
        vecs.push(...embeds);
      }
    }
    await upsertChunkBatch(db, rel, parts, vecs.length === parts.length ? vecs : undefined);
  }

  await db.close();
  console.log(`Indexed ${files.length} files → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
