// src/pendingServices/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';
import { PendingService, PendingServicesEnvelope } from './schemas/pendingServicesSchemas.js';

export default fp(async function pendingServicesPlugin(fastify, opts) {
  // Register schemas
  fastify.addSchema(PendingService);
  fastify.addSchema(PendingServicesEnvelope);

  // Register routes
  fastify.register(routes);
});
