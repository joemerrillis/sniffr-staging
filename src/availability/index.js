// src/availability/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  HeatmapEnvelope,
  BlackoutEnvelope
} from './schemas/availabilitySchemas.js';

export default fp(async function availabilityPlugin(fastify, opts) {
  fastify.addSchema(HeatmapEnvelope);
  fastify.addSchema(BlackoutEnvelope);
  fastify.register(routes, opts);
});
