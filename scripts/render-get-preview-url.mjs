// scripts/render-get-preview-url.mjs
// Query Render API for the latest PR preview deployment URL for a service + branch
// Usage: env SERVICE_ID, RENDER_API_KEY, BRANCH

import https from 'node:https';

function call(path) {
  const opts = {
    hostname: 'api.render.com',
    path,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${process.env.RENDER_API_KEY}` }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject); req.end();
  });
}

async function main() {
  const serviceId = process.env.SERVICE_ID;
  const branch = process.env.BRANCH;
  if (!serviceId || !branch) throw new Error('Missing SERVICE_ID or BRANCH');
  const { status, data } = await call(`/v1/services/${serviceId}/deploys`);
  if (status !== 200) throw new Error(`Render API ${status}: ${data}`);
  const deploys = JSON.parse(data);
  // Find the newest successful deploy for the branch
  const match = deploys.find(d => d.commit && d.commit.branch === branch && d.status === 'live');
  if (!match || !match.staticSite) {
    if (!match || !match.urls || match.urls.length === 0) throw new Error('No live preview URL found');
  }
  const url = (match && match.urls && match.urls[0]) || match.staticSite?.url;
  process.stdout.write(url);
}

main().catch(e => { console.error(e); process.exit(1); });
