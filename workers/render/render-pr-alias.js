// workers/render-pr-alias.mjs
// Dual-origin PR preview router: one pretty domain, two upstreams (web + api)
// - Control-plane: POST with { action: "upsert"|"delete", pr|prId, api?, web?, origin?|url?, apiPrefixes? } (+ x-webhook-secret)
// - Data-plane: Host like pr-123-stage.previews.sniffrpack.com routes
//      paths starting with any apiPrefixes → api, everything else → web

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;

    // Control-plane if called on workers.dev OR when path starts with /_control
    const isControl = host.endsWith("workers.dev") || url.pathname.startsWith("/_control");
    return isControl ? controlPlane(request, env) : dataPlane(request, env);
  }
};

function prFromHost(host) {
  // expected host like pr-123-stage.previews.sniffrpack.com
  const left = host.split(".")[0];      // "pr-123-stage"
  const match = left.match(/pr-(\d+)-/i);
  return match ? match[1] : null;
}

async function controlPlane(request, env) {
  if (request.method === 'GET' && new URL(request.url).pathname === '/_control/health') {
    return json({ ok: true, service: 'preview-router' });
  }

  if (request.method !== 'POST') {
    return new Response('Only POST', { status: 405 });
  }

  // simple HMAC-style shared-secret gate
  const secret = request.headers.get('x-webhook-secret');
  if (!secret || secret !== env.WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { action, pr, prId, url, origin, api, web, apiPrefixes } = body;
  const prNum = pr || prId;
  if (!prNum) return new Response('Missing pr', { status: 400 });

  const kvKey = `pr:${prNum}`;

  if (action === 'delete') {
    await env.PR_PREVIEWS.delete(kvKey);
    return json({ ok: true, deleted: kvKey });
  }

  if (action !== 'upsert') {
    return new Response('Unknown action', { status: 400 });
  }

  // Normalize and store
  let rec;
  try {
    rec = normalizeRecord({ origin, url, api, web, apiPrefixes });
  } catch (e) {
    return new Response(`Bad input: ${e.message}`, { status: 400 });
  }

  await env.PR_PREVIEWS.put(kvKey, JSON.stringify(rec), {
    metadata: { createdAt: Date.now() }
  });

  return json({ ok: true, upserted: kvKey, rec });
}

function normalizeRecord({ origin, url, api, web, apiPrefixes }) {
  const norm = (u) => {
    if (!u) return null;
    try {
      const x = new URL(u);
      return `${x.protocol}//${x.host}`; // keep base only
    } catch {
      return null;
    }
  };

  const single = norm(origin || url);
  const a = norm(api) || single;
  const w = norm(web) || single;

  if (!a || !w) throw new Error('At least one valid origin required (api/web or origin/url)');

  // default to ['/api','/rapi-doc'] to satisfy your docs path routing request
  const prefixes = Array.isArray(apiPrefixes) && apiPrefixes.length
    ? apiPrefixes.filter(p => typeof p === 'string' && p.startsWith('/'))
    : ['/api', '/rapi-doc'];

  return { api: a, web: w, apiPrefixes: prefixes };
}

async function dataPlane(request, env) {
  const url = new URL(request.url);
  const prNum = prFromHost(url.hostname);
  if (!prNum) return new Response('Not a PR host', { status: 404 });

  const kvKey = `pr:${prNum}`;
  const raw = await env.PR_PREVIEWS.get(kvKey);
  if (!raw) return new Response('No mapping', { status: 404 });

  const rec = JSON.parse(raw); // { api, web, apiPrefixes? }
  const prefixes = Array.isArray(rec.apiPrefixes) && rec.apiPrefixes.length
    ? rec.apiPrefixes
    : ['/api', '/rapi-doc'];

  const toApi = prefixes.some(prefix => url.pathname.startsWith(prefix));

  // DEBUG (optional – remove later)
  if (url.searchParams.has('__debug')) {
    return json({ pr: prNum, path: url.pathname, prefixes, toApi, chosen: toApi ? rec.api : rec.web });
  }

  const upstreamBase = toApi ? rec.api : rec.web;
  const upstream = new URL(upstreamBase);
  upstream.pathname = url.pathname;
  upstream.search = url.search;

  const headers = new Headers(request.headers);
  headers.set('host', upstream.host);

  return fetch(upstream.toString(), {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    redirect: 'follow'
  });
}



function json(obj, init = {}) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init
  });
}
