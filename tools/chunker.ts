// tools/chunker.ts
// Function/class aware chunking via tree-sitter for JS/TS.

import fs from 'node:fs';
import path from 'node:path';
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TS from 'tree-sitter-typescript';

const { typescript, tsx } = TS;

export type Chunk = { path: string; ord: number; text: string };

function pickLanguage(ext: string) {
  switch (ext) {
    case '.ts': return typescript;
    case '.tsx': return tsx;
    case '.mts': return typescript;
    case '.cts': return typescript;
    case '.js':
    case '.mjs':
    case '.cjs':
    case '.jsx': return JavaScript;
    default: return null;
  }
}

function slice(src: string, node: any) {
  return src.slice(node.startIndex, node.endIndex);
}

function nodeIsTopLevelFuncLike(n: any): boolean {
  const t = n.type;
  if (t === 'function_declaration' || t === 'class_declaration') return true;
  // export default function …
  if (t === 'export_statement') {
    const c0 = n.namedChild(0);
    if (!c0) return false; const ct = c0.type;
    return ct === 'function_declaration' || ct === 'class_declaration';
  }
  // const x = () => …  |  const x = function …
  if (t === 'lexical_declaration' || t === 'variable_declaration') {
    for (let i = 0; i < n.namedChildCount; i++) {
      const d = n.namedChild(i);
      if (!d || d.type !== 'variable_declarator') continue;
      const init = d.childForFieldName('value');
      if (!init) continue;
      if (init.type === 'arrow_function' || init.type === 'function') return true;
    }
  }
  return false;
}

export async function chunkSource(filePath: string, src?: string): Promise<Chunk[]> {
  const code = src ?? fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  const Lang = pickLanguage(ext);
  const chunks: Chunk[] = [];

  if (!Lang) return naiveChunks(filePath, code);

  try {
    const parser = new Parser();
    parser.setLanguage(Lang);
    const tree = parser.parse(code);
    const root = tree.rootNode;
    let ord = 0;

    // Walk only top-level statements for stability
    for (let i = 0; i < root.namedChildCount; i++) {
      const n = root.namedChild(i);
      if (!n) continue;
      if (nodeIsTopLevelFuncLike(n)) {
        chunks.push({ path: filePath, ord: ord++, text: slice(code, n) });
      }
    }

    // Fallback if nothing matched
    if (chunks.length === 0) return naiveChunks(filePath, code);
    return chunks;
  } catch (_e) {
    return naiveChunks(filePath, code);
  }
}

function naiveChunks(pathName: string, src: string): Chunk[] {
  const MAX = 2000; // characters per chunk
  const out: Chunk[] = [];
  let ord = 0;
  for (let i = 0; i < src.length; i += MAX) {
    out.push({ path: pathName, ord: ord++, text: src.slice(i, Math.min(i + MAX, src.length)) });
  }
  return out;
}
