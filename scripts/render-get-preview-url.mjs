// scripts/render-get-preview-url.mjs
// Query Render API for the PR preview URL, with polling until the deploy is live.
// env: SERVICE_ID, RENDER_API_KEY, BRANCH, WAIT_SECS?(default 600), POLL_EVERY?(default 10)

import https from 'node:https';

function call(path) {
  const opts = {
    hostname: 'api.render.com',
    path,
    method: 'GET',
    headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}` },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
}

function pickUrl(d) {
  if (Array.isArray(d.urls) && d.urls.length) return d.urls[0];
  if (d.staticSite?.url) return d.staticSite.url;
  return null;
}

async function fetchOnce(serviceId, branch) {
  const { status, data } = await call(`/v1/services/${serviceId}/deploys`);
  if (status !== 200) throw new Error(`Render API ${status}: ${data}`);
  const deploys = JSON.parse(data);
  const list = deploys.filter((d) => d.commit && d.commit.branch === branch);
  if (!list.length) return { state: 'none' };
  list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const d = list[0];
  const url = pickUrl(d);
  if (d.status === 'live' && url) return { state: 'live', url };
  if ((d.status || '').includes('in_progress')) return { state: 'building' };
  if (d.status === 'failed') return { state: 'failed', reason: 'build failed' };
  return { state: 'pending' };
}

async function main() {
  const serviceId = process.env.SERVICE_ID;
  const branch = process.env.BRANCH;
  const waitSecs = Number(process.env.WAIT_SECS || 600);
  const every = Number(process.env.POLL_EVERY || 10);
  if (!serviceId || !branch) throw new Error('Missing SERVICE_ID or BRANCH');

  const start = Date.now();
  while (true) {
    const r = await fetchOnce(serviceId, branch);
    if (r.state === 'live' && r.url) {
      process.stdout.write(r.url);
      return;
    }
    if (r.state === 'failed') throw new Error('Render preview build failed');
    if ((Date.now() - start) / 1000 > waitSecs) throw new Error('Timed out waiting for live preview URL');
    await new Promise((res) => setTimeout(res, every * 1000));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
