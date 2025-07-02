import fp from 'fastify-plugin';
import dogEventsRoutes from './routes/dogEventsRoutes.js';
import { dogEventsSchemas } from './schemas/dogEventsSchemas.js';

export default fp(async function dogEventsPlugin(fastify, opts) {
  for (const schema of Object.values(dogEventsSchemas)) {
    try { fastify.addSchema(schema); } catch (e) {}
  }
  fastify.register(dogEventsRoutes, opts); // <-- IMPORTANT: pass opts!
});
