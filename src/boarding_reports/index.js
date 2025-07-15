// src/boarding_reports/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import { boardingReportsSchemas } from './schemas/boardingReportsSchemas.js';

export default fp(async function boardingReportsPlugin(fastify, opts) {
  // Register all schemas ONCE (avoid duplicate $id errors)
  for (const schema of Object.values(boardingReportsSchemas)) {
    try {
      fastify.addSchema(schema);
    } catch (e) {
      // Ignore FST_ERR_SCH_ALREADY_PRESENT
    }
  }

  // Register all routes
  fastify.register(routes);
});
