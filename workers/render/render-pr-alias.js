// worker/preview-router.mjs
// Dual-origin PR preview router: one pretty domain, two upstreams (web + api)
// - Control-plane: POST with { action: "upsert"|"delete", pr, api, web } (+ x-webhook-secret)
// - Data-plane: Host like pr-123-stage.previews.sniffrpack.com routes /api → api, else → web

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;
    const isControl = host.endsWith("workers.dev") || url.pathname.startsWith("/_control");
    return isControl ? controlPlane(request, env) : dataPlane(request, env);
  }
};

function prFromHost(host, root = (host.split(".").slice(-3).join("."))) {
  // expected host like pr-123-stage.previews.sniffrpack.com
  // Extract the left-most label and parse pr number
  const left = host.split(".")[0];
  const match = left.match(/pr-(\d+)-/i);
  if (!match) return null;
  return match[1];
}

async function controlPlane(request, env) {
  if (request.method !== 'POST') {
    return new Response('Only POST', { status: 405 });
  }
  const secret = request.headers.get('x-webhook-secret');
  if (!secret || secret !== env.WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { action, pr, prId, url, origin, api, web } = body;
  const prNum = pr || prId;
  if (!prNum) return new Response('Missing pr', { status: 400 });

  const kvKey = `pr:${prNum}`;
  if (action === 'delete') {
    await env.PR_PREVIEWS.delete(kvKey);
    return json({ ok: true, deleted: kvKey });
  }

  if (action !== 'upsert') return new Response('Unknown action', { status: 400 });

  // Back-compat: if only a single origin is provided, use it for both api+web
  const rec = normalizeOrigins({ origin, url, api, web });
  await env.PR_PREVIEWS.put(kvKey, JSON.stringify(rec), { metadata: { createdAt: Date.now() } });
  return json({ ok: true, upserted: kvKey, rec });
}

function normalizeOrigins({ origin, url, api, web }) {
  const norm = (u) => {
    if (!u) return null;
    try { const x = new URL(u); return `${x.protocol}//${x.host}`; } catch { return null; }
  };
  const single = norm(origin || url);
  const a = norm(api) || single;
  const w = norm(web) || single;
  if (!a || !w) throw new Error('At least one origin required');
  return { api: a, web: w };
}

async function dataPlane(request, env) {
  const url = new URL(request.url);
  const prNum = prFromHost(url.hostname);
  if (!prNum) return new Response('Not a PR host', { status: 404 });

  const kvKey = `pr:${prNum}`;
  const raw = await env.PR_PREVIEWS.get(kvKey);
  if (!raw) return new Response('No mapping', { status: 404 });
  const rec = JSON.parse(raw); // { api, web }

  const upstreamBase = url.pathname.startsWith('/api') ? rec.api : rec.web;
  const upstream = new URL(upstreamBase);
  upstream.pathname = url.pathname;
  upstream.search = url.search;

  const headers = new Headers(request.headers);
  headers.set('host', upstream.host);

  const resp = await fetch(upstream.toString(), {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    redirect: 'follow'
  });
  return resp;
}

function json(obj, init = {}) { return new Response(JSON.stringify(obj), { status: 200, headers: { 'content-type': 'application/json' }, ...init }); }
