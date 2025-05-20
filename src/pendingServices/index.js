// src/pendingServices/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  PendingService,
  PendingServicesEnvelope,
  PendingServiceEnvelope
} from './schemas/pendingServicesSchemas.js';

export default fp(async function pendingServicesPlugin(fastify, opts) {
  fastify.addSchema(PendingService);
  fastify.addSchema(PendingServicesEnvelope);
  fastify.addSchema(PendingServiceEnvelope);
  fastify.register(routes, opts);
});
