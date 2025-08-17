// tools/sqlite.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export async function openDb(file: string): Promise<Database> {
  return open({ filename: file, driver: sqlite3.Database });
}

export async function ensureSchema(db: Database) {
  await db.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      ord INTEGER NOT NULL,
      text TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_chunks_path_ord ON chunks(path, ord);
    CREATE TABLE IF NOT EXISTS chunk_vec (
      id INTEGER PRIMARY KEY,
      vec BLOB
    );
  `);
}

export async function upsertChunkBatch(db: Database, path: string, parts: string[], vecs?: Float32Array[]) {
  await db.exec('BEGIN');
  try {
    const ins = await db.prepare('INSERT OR REPLACE INTO chunks(path, ord, text) VALUES (?,?,?)');
    for (let i=0;i<parts.length;i++) await ins.run(path, i, parts[i]);
    await ins.finalize();

    if (vecs && vecs.length === parts.length) {
      const insv = await db.prepare('INSERT OR REPLACE INTO chunk_vec(id, vec) VALUES (?,?)');
      for (let i=0;i<vecs.length;i++) {
        const buf = Buffer.from(vecs[i].buffer);
        await insv.run(await idFor(db, path, i), buf);
      }
      await insv.finalize();
    }
    await db.exec('COMMIT');
  } catch (e) { await db.exec('ROLLBACK'); throw e; }
}

async function idFor(db: Database, path: string, ord: number): Promise<number> {
  const row = await db.get('SELECT id FROM chunks WHERE path=? AND ord=?', path, ord);
  return row?.id;
}
