// src/dog_memories/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import { dogMemoriesSchemas } from './schemas/dogMemoriesSchemas.js';

export default fp(async function dogMemoriesPlugin(fastify, opts) {
  // Register all schemas ONCE (avoid $id errors)
  for (const schema of Object.values(dogMemoriesSchemas)) {
    try { fastify.addSchema(schema); } catch (e) {}
  }
  fastify.register(routes);
});
