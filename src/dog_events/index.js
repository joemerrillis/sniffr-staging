import fp from 'fastify-plugin';
import dogEventsRoutes from './routes/dogEventsRoutes.js';
import { dogEventsSchemas } from './schemas/dogEventsSchemas.js';

export default fp(async function dogEventsPlugin(fastify, opts) {
  console.log('Registering dogEvents schemas...');
  for (const schema of Object.values(dogEventsSchemas)) {
    console.log('[dog_events] Registering schema:', schema.$id);
    try { fastify.addSchema(schema); }
    catch (e) { 
      console.error('[dog_events] ERROR registering', schema.$id, e.message);
      throw e;
    }
  }
  fastify.register(dogEventsRoutes, opts);
});
