import fp from 'fastify-plugin';
import dogEventsRoutes from './routes/dogEventsRoutes.js';
import { dogEventsSchemas } from './schemas/dogEventsSchemas.js';

export default fp(async function dogEventsPlugin(fastify, opts) {
  for (const schema of Object.values(dogEventsSchemas)) {
    try { fastify.addSchema(schema); } catch (e) {}
  }
  fastify.register(dogEventsRoutes, opts); // <-- IMPORTANT: pass opts!
});
console.log('Registering dogEvents schemas...');
for (const schema of Object.values(dogEventsSchemas)) {
  console.log('[dog_events] Registering schema:', schema.$id);
  try { fastify.addSchema(schema); }
  catch (e) { 
    console.error('[dog_events] ERROR registering', schema.$id, e.message);
    throw e; // Let the deploy fail and show logs
  }
}
