# Sniffr – Routing Conventions

## Plugin Registration
- One plugin per feature at: `src/<feature>/routes.js`
- Register in `index.js` with a prefix:
  ```js
  // index.js (example)
  import path from 'path';
  import fastifyStatic from '@fastify/static';

  // Static first
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/rapi-doc/',
    decorateReply: false,
  });
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/',
  });

  // Feature plugin registration pattern
  await fastify.register(import('./src/<feature>/routes.js'), { prefix: '/<feature>' });

  // Agent sanity (optional global)
  // GET /_agent/health -> { ok: true }
