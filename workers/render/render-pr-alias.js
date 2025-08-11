export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const isWorkersDev = url.hostname.endsWith('.workers.dev');

    // ---------- Control plane (webhooks & cleanup) ----------
    if (isWorkersDev && req.method === 'POST') {
      const secret = req.headers.get('x-hook-secret');
      if (!secret || secret !== env.WEBHOOK_SECRET) {
        return new Response('forbidden', { status: 403 });
      }

      const text = await req.text();
      let payload = {};
      try { payload = JSON.parse(text || '{}'); } catch {}

      const action = (payload.action || '').toLowerCase();

      // ----- Cleanup mode: delete DNS + Route + KV for PR -----
      if (action === 'delete') {
        const prId = Number(payload.prId);
        if (!Number.isFinite(prId)) return new Response('bad prId', { status: 400 });

        const fqdn = `pr-${prId}-stage.${env.ROOT_DOMAIN}`;
        await deleteDns(env, fqdn);
        await deleteRoute(env, `${fqdn}/*`);
        await env.PR_PREVIEWS.delete(fqdn);

        return new Response(`deleted: ${fqdn}`, { status: 200 });
      }

      // ----- Webhook from Render: upsert mapping + DNS + route -----
      const deploy = payload.deploy || payload;
      const isPreview = !!(deploy.preview ?? deploy.isPreview ?? deploy.type === 'preview');
      const previewUrl = (deploy.url || deploy.deployUrl || '').toString();
      const commitMsg = deploy.commit?.message || '';
      const explicitPr = payload.pullRequestId ?? payload.prId ?? payload.prNumber;
      const prId = Number(explicitPr ?? (commitMsg.match(/PR[ #]?(\d+)/i)?.[1] ?? NaN));

      if (!isPreview || !previewUrl || !Number.isFinite(prId)) {
        return new Response('ignored', { status: 200 });
      }

      const fqdn = `pr-${prId}-stage.${env.ROOT_DOMAIN}`;
      const targetHost = previewUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // KV: host -> preview host
      await env.PR_PREVIEWS.put(fqdn, targetHost);

      // DNS: create/update proxied A (dummy IP, worker route intercepts before origin)
      await upsertDnsA(env, fqdn, '192.0.2.1');

      // Route: pr-<n>-stage.<root>/* -> this worker
      await ensureRoute(env, `${fqdn}/*`);

      // Optional PR comment
      if (env.GH_TOKEN && env.GH_REPO) {
        const body = { body: `🔗 Preview ready: https://${fqdn}` };
        await fetch(`https://api.github.com/repos/${env.GH_REPO}/issues/${prId}/comments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GH_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }).catch(() => {});
      }

      return new Response(`ok: ${fqdn} -> ${targetHost}`, { status: 200 });
    }

    // ---------- Data plane (proxy PR traffic) ----------
    // Only handle exact PR hosts like pr-123-stage.sniffrpack.com
    const prHostRe = new RegExp(`^pr-\\d+-stage\\.${escapeDot(env.ROOT_DOMAIN)}$`);
    if (prHostRe.test(url.hostname)) {
      const targetHost = await env.PR_PREVIEWS.get(url.hostname);
      if (!targetHost) return new Response('Preview mapping not found.', { status: 404 });

      const originUrl = `https://${targetHost}${url.pathname}${url.search}`;
      const init = {
        method: req.method,
        headers: new Headers(req.headers),
        body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : await req.arrayBuffer(),
      };
      const res = await fetch(originUrl, init);
      return new Response(res.body, { status: res.status, headers: res.headers });
    }

    return new Response('ok', { status: 200 });
  }
};

// ---------- helpers ----------
function escapeDot(d) { return d.replace(/\./g, '\\.'); }

async function upsertDnsA(env, name, ip) {
  const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ZONE_ID: zone } = env;
  const H = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const find = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?name=${name}`,
    { headers: H }
  ).then(r => r.json());

  const payload = JSON.stringify({ type: 'A', name, content: ip, ttl: 1, proxied: true });

  const id = find?.result?.[0]?.id;
  if (id) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${id}`, {
      method: 'PUT', headers: H, body: payload
    });
  } else {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records`, {
      method: 'POST', headers: H, body: payload
    });
  }
}

async function deleteDns(env, name) {
  const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ZONE_ID: zone } = env;
  const H = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const find = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?name=${name}`,
    { headers: H }
  ).then(r => r.json());
  const id = find?.result?.[0]?.id;
  if (id) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${id}`, {
      method: 'DELETE', headers: H
    });
  }
}

async function ensureRoute(env, pattern) {
  const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ZONE_ID: zone, WORKER_NAME: script } = env;
  const H = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const list = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/workers/routes`,
    { headers: H }
  ).then(r => r.json());

  const existing = (list?.result || []).find(r => r.pattern === pattern && r.script === script);
  if (!existing) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/workers/routes`, {
      method: 'POST', headers: H, body: JSON.stringify({ pattern, script })
    });
  }
}

async function deleteRoute(env, pattern) {
  const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ZONE_ID: zone } = env;
  const H = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const list = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zone}/workers/routes`,
    { headers: H }
  ).then(r => r.json());

  const hit = (list?.result || []).find(r => r.pattern === pattern);
  if (hit?.id) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/workers/routes/${hit.id}`, {
      method: 'DELETE', headers: H
    });
  }
}
