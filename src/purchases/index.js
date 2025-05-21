// src/purchases/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';
import { purchasesSchemas } from './schemas/purchasesSchemas.js';

export default fp(async function purchasesPlugin(fastify, opts) {
  // Register schemas for Swagger/OpenAPI
  fastify.addSchema(purchasesSchemas.Purchase);
  // Register all other schemas as needed
  // (They don't have $id so not used for $ref, but safe to register)
  fastify.register(routes, { prefix: '/purchases' });
});
