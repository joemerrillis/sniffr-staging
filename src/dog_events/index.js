import fp from 'fastify-plugin';
import dogEventsRoutes from './routes/dogEventsRoutes.js';
import { dogEventsSchemas } from './schemas/dogEventsSchemas.js';

console.trace('[dog_events] dogEventsSchemas.js loaded (trace shows who loaded it)');

export default fp(async function dogEventsPlugin(fastify, opts) {
  console.log('Registering dogEvents schemas...');

  let registered = new Set();
  let count = 0;

  for (const schema of Object.values(dogEventsSchemas)) {
    count++;
    if (registered.has(schema.$id)) {
      console.warn(`[dog_events] DUPLICATE registration attempt for schema: ${schema.$id} (index: ${count})`);
    } else {
      registered.add(schema.$id);
    }

    console.log(`[dog_events] Registering schema: ${schema.$id} (index: ${count})`);
    try {
      fastify.addSchema(schema);
      console.log(`[dog_events] Successfully registered schema: ${schema.$id} (index: ${count})`);
    }
    catch (e) { 
      console.error('[dog_events] ERROR registering', schema.$id, `(index: ${count})`, e.message);
      throw e;
    }
  }

  console.log(`[dog_events] Total schemas processed: ${count}`);

  fastify.register(dogEventsRoutes, opts);
});
