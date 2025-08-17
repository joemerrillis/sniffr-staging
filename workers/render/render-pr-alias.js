// render-pr-alias.js

/**
 * Env bindings you must set:
 *  - PR_PREVIEWS (KV Namespace)
 *  - WEBHOOK_SECRET (secret)
 *  - ROOT_DOMAIN = "previews.sniffrpack.com"
 *
 * Route (wrangler.toml):  *.previews.sniffrpack.com/*
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;

    // -------- 1) Control plane: webhook to upsert/delete mappings --------
    if (url.hostname.endsWith(".workers.dev")) {
      if (request.method !== "POST") {
        return new Response("Not Found", { status: 404 });
      }

      const secret = request.headers.get("x-hook-secret") || request.headers.get("x-webhook-secret");
      if (secret !== env.WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }

      const action = (payload.action || "").toLowerCase(); // "upsert" | "delete"
      // allow either "pr" or "prId" as the field name
      const prNum = payload.pr ?? payload.prId;
      const origin = payload.url ?? payload.origin ?? payload.deploy?.url;

      if (!prNum || (action === "upsert" && !origin)) {
        return new Response("Missing required fields", { status: 400 });
      }

      const kvKey = `pr:${prNum}`;
      if (action === "delete") {
        await env.PR_PREVIEWS.delete(kvKey);
        return json({ ok: true, action, pr: prNum, deleted: true });
      }

      // normalize origin (remove trailing slash)
      const normalized = String(origin).replace(/\/+$/, "");
      await env.PR_PREVIEWS.put(kvKey, normalized, { metadata: { createdAt: Date.now() } });
      return json({ ok: true, action, pr: prNum, origin: normalized });
    }

    // -------- 2) Data plane: handle pretty URL hosts --------
    // e.g. pr-123-stage.previews.sniffrpack.com
    const expectedSuffix = `.${env.ROOT_DOMAIN}`;
    if (host.endsWith(expectedSuffix)) {
      // parse "pr-<num>-stage"
      const sub = host.slice(0, -expectedSuffix.length); // "pr-123-stage"
      const m = /^pr-(\d+)-stage$/i.exec(sub);
      if (!m) {
        // Not a preview host we recognize -> don't expose internals
        return new Response("Not Found", { status: 404 });
      }

      const prNum = m[1];
      const kvKey = `pr:${prNum}`;
      const origin = await env.PR_PREVIEWS.get(kvKey);

      if (!origin) {
        // mapping missing -> friendly 404 so you know it's a wiring issue
        return new Response(`No mapping for PR ${prNum}`, { status: 404 });
      }

      // Build full upstream URL (preserve path + search)
      // e.g. https://<origin>/the/same/path?and=query
      const upstream = new URL(origin);
      upstream.pathname = joinPath(upstream.pathname, url.pathname);
      upstream.search = url.search;

      // Proxy the request (method/body/headers) to the Render origin
      const reqInit = {
        method: request.method,
        headers: new Headers(request.headers),
        body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
        redirect: "follow",
      };
      // override the Host header so upstream sees its own host
      reqInit.headers.set("host", upstream.hostname);

      const resp = await fetch(upstream.toString(), reqInit);

      // You can tweak caching here if desired
      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers: resp.headers,
      });
    }

    // Anything else
    return new Response("Not Found", { status: 404 });
  },
};

// helpers
function json(obj, init = {}) {
  const body = JSON.stringify(obj, null, 2);
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(body, { ...init, headers });
}

function joinPath(a = "", b = "") {
  const left = a.endsWith("/") ? a.slice(0, -1) : a;
  const right = b.startsWith("/") ? b : `/${b}`;
  return `${left}${right}`;
}
