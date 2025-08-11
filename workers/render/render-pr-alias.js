export default {
  async fetch(req, env) {
    try {
      // 1) Verify shared secret
      const secret = req.headers.get('x-hook-secret');
      if (!secret || secret !== env.WEBHOOK_SECRET) {
        return new Response('forbidden', { status: 403 });
      }

      // 2) Parse payload from Render webhook
      const bodyText = await req.text();
      let payload = {};
      try { payload = JSON.parse(bodyText || '{}'); } catch {}
      const deploy = payload.deploy || payload;

      // Render payloads vary by account; we try a few common fields
      const isPreview = !!(deploy.preview ?? deploy.isPreview ?? deploy.type === 'preview');
      const previewUrl = (deploy.url || deploy.deployUrl || '').toString();
      const commitMsg = deploy.commit?.message || '';
      const explicitPr = payload.pullRequestId ?? payload.prId ?? payload.prNumber;

      // Try to get PR number from explicit field or from commit message like "PR 12"
      const prId = Number(explicitPr ?? (commitMsg.match(/PR[ #]?(\d+)/i)?.[1] ?? NaN));

      // If not a preview or missing info, ignore gracefully
      if (!isPreview || !previewUrl || !Number.isFinite(prId)) {
        return new Response('ignored', { status: 200 });
      }

      // 3) Build pretty single-level FQDN (avoids nested subdomain SSL issue)
      // e.g., pr-12-stage.sniffrpack.com
      const fqdn = `pr-${prId}-stage.${env.ROOT_DOMAIN}`;

      // Normalize Render host (strip protocol & trailing slash)
      const target = previewUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // 4) Upsert CNAME in Cloudflare
      const zoneId = env.CLOUDFLARE_ZONE_ID;
      const cfHeaders = {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      };

      // Look up existing record
      const lookupResp = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=CNAME&name=${fqdn}`,
        { headers: cfHeaders }
      ).then(r => r.json());

      const existingId = lookupResp?.result?.[0]?.id;

      const recordPayload = JSON.stringify({
        type: 'CNAME',
        name: fqdn,
        content: target,
        ttl: 1,
        proxied: true
      });

      if (existingId) {
        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existingId}`,
          { method: 'PUT', headers: cfHeaders, body: recordPayload }
        );
      } else {
        await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
          { method: 'POST', headers: cfHeaders, body: recordPayload }
        );
      }

      // 5) Optional: comment the pretty URL back on the PR
      if (env.GH_TOKEN && env.GH_REPO) {
        const commentBody = { body: `🔗 Preview ready: https://${fqdn}` };
        await fetch(`https://api.github.com/repos/${env.GH_REPO}/issues/${prId}/comments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GH_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(commentBody)
        }).catch(() => {});
      }

      return new Response(`ok: ${fqdn} -> ${target}`, { status: 200 });
    } catch (err) {
      return new Response(`error: ${err?.message || String(err)}`, { status: 500 });
    }
  }
};
