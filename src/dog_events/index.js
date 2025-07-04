import fp from 'fastify-plugin';
import dogEventsRoutes from './routes/dogEventsRoutes.js';
import { dogEventsSchemas } from './schemas/dogEventsSchemas.js';

export default fp(async function dogEventsPlugin(fastify, opts) {
  // Register all schemas ONCE at plugin load
  Object.values(dogEventsSchemas).forEach(schema => {
    try { fastify.addSchema(schema); } catch (e) {}
  });
  fastify.register(dogEventsRoutes, opts);
});
