# Sniffr – Routing Conventions

## Registration
- One plugin per feature: `src/<feature>/routes.js`
- Register in `index.js`:
  ```js
  // example
  await fastify.register(
    import('./src/<feature>/routes.js'),
    { prefix: '/<feature>' }
  );


