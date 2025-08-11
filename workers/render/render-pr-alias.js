export default {
  async fetch(req, env, ctx) {
    // simple shared-secret check
    const secret = req.headers.get('x-hook-secret');
    if (!secret || secret !== env.WEBHOOK_SECRET) {
      return new Response('forbidden', { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Render webhook shape varies—log first few to see exact keys
    // Expected fields to try:
    // body.deploy?.preview === true
    // body.deploy?.url  (preview hostname like https://pr-123-xxxxx.onrender.com)
    // body.pullRequestId OR body.deploy?.commit?.message containing "PR 123"
    const deploy = body.deploy || body; // be forgiving
    const isPreview = !!deploy.preview;
    const previewUrl = deploy.url || deploy.deployUrl || '';
    const commitMsg = deploy.commit?.message || '';
    const prId =
      body.pullRequestId ||
      (commitMsg.match(/PR[ #]?(\d+)/i)?.[1] ?? null);

    if (!isPreview || !previewUrl || !prId) {
      // Not a PR preview, or missing data—ignore gracefully
      return new Response('ignored', { status: 200 });
    }

    // Build pretty domain
    const fqdn = `pr-${prId}.stage.${env.ROOT_DOMAIN}`; // e.g., pr-123.stage.sniffrpack.com

    // Normalize preview target host (strip protocol)
    const target = previewUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Upsert CNAME in Cloudflare
    const zoneId = env.CLOUDFLARE_ZONE_ID;
    const cfHeaders = {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Lookup existing
    const lookup = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=CNAME&name=${fqdn}`,
      { headers: cfHeaders }
    ).then(r => r.json());

    const existingId = lookup?.result?.[0]?.id;

    const payload = JSON.stringify({
      type: 'CNAME',
      name: fqdn,
      content: target,
      ttl: 1,
      proxied: true
    });

    if (existingId) {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existingId}`,
        { method: 'PUT', headers: cfHeaders, body: payload }
      );
    } else {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        { method: 'POST', headers: cfHeaders, body: payload }
      );
    }

    // (Optional) comment the pretty URL back on the PR
    if (env.GH_TOKEN && env.GH_REPO) {
      await fetch(`https://api.github.com/repos/${env.GH_REPO}/issues/${prId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GH_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: `🔗 Preview ready: https://${fqdn}` })
      }).catch(() => {});
    }

    return new Response(`ok: ${fqdn} -> ${target}`, { status: 200 });
  }
};
