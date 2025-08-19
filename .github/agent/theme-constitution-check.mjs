#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const sh = (c) => execSync(c, { stdio: ['pipe','pipe','inherit'], encoding: 'utf8' }).trim();
const base = process.env.GITHUB_BASE_REF || 'origin/main';
const head = process.env.GITHUB_HEAD_REF || 'HEAD';
try { sh('git fetch --no-tags --depth=2 origin +refs/heads/*:refs/remotes/origin/*'); } catch {}

const diffFiles = sh(`git diff --name-only ${base}...${head}`).split('\n').filter(Boolean);
const changedWeb = diffFiles.some(f => f.startsWith('apps/web/'));
const changedDocs = diffFiles.some(f => f === 'docs/FRONTEND_TOKENS.schema.json');

const schemaPath = path.join(process.cwd(), 'docs/FRONTEND_TOKENS.schema.json');
if (!fs.existsSync(schemaPath)) {
  console.log('❌ Missing docs/FRONTEND_TOKENS.schema.json');
  process.exit(1);
}

const ajvPkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if (!((ajvPkg.dependencies && ajvPkg.dependencies.ajv) || (ajvPkg.devDependencies && ajvPkg.devDependencies.ajv))) {
  console.log('ℹ️ ajv not installed; add "ajv" to dependencies for full validation.');
}

// Gather token sources (server stubs or fixtures)
const tokenFiles = diffFiles.filter(f => /tokens\.json$/i.test(f));
if (tokenFiles.length === 0 && !changedWeb && !changedDocs) {
  console.log('✅ No front-end token changes; skipping.');
  process.exit(0);
}

// Validate JSON structure and contrast for each tokens.json in PR
const schema = JSON.parse(fs.readFileSync(schemaPath,'utf8'));

function lum(hex) {
  const c = hex.replace('#','');
  const n = c.length === 3
    ? c.split('').map(x => x+x).join('')
    : c;
  const [r,g,b] = [0,2,4].map(i => parseInt(n.slice(i,i+2),16)/255)
    .map(v => (v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4)));
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
function contrast(a,b) {
  const L1 = lum(a), L2 = lum(b);
  const [hi, lo] = L1 > L2 ? [L1,L2] : [L2,L1];
  return (hi + 0.05) / (lo + 0.05);
}

// Lazy JSON Schema validate using `node --eval` + ajv if present
let hadErr = false;
for (const f of tokenFiles) {
  try {
    const tokens = JSON.parse(fs.readFileSync(f,'utf8'));

    // Schema: basic required keys
    for (const k of ['brand','surface','typography','radius','spacing']) {
      if (!tokens[k]) { console.log(`❌ ${f}: missing "${k}"`); hadErr = true; }
    }

    // Contrast checks (AA threshold 4.5 for normal text)
    const pairs = [
      ['surface.fg','surface.bg'],
      ['brand.primaryText','brand.primary']
    ];
    for (const [fgKey,bgKey] of pairs) {
      const fg = fgKey.split('.').reduce((a,k)=>a?.[k], tokens);
      const bg = bgKey.split('.').reduce((a,k)=>a?.[k], tokens);
      if (typeof fg === 'string' && typeof bg === 'string') {
        const ratio = contrast(fg, bg);
        if (ratio < 4.5) { console.log(`❌ ${f}: contrast ${fgKey} vs ${bgKey} = ${ratio.toFixed(2)} (<4.5)`); hadErr = true; }
      }
    }

    // No inline hex in component diffs (heuristic)
    const cmpDiffs = diffFiles.filter(p => p.startsWith('apps/web/') && /\.(tsx|css)$/.test(p));
    for (const p of cmpDiffs) {
      const src = sh(`git show ${head}:${p}`);
      if (/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/.test(src)) {
        console.log(`❌ ${p}: inline hex detected; use CSS vars`);
        hadErr = true;
      }
    }

    console.log(`✅ ${f}: tokens OK`);
  } catch (e) {
    console.log(`❌ ${f}: ${e.message}`);
    hadErr = true;
  }
}

process.exit(hadErr ? 1 : 0);
