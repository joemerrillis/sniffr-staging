import fp from 'fastify-plugin';
import routes from './routes.js';
import { purchasesSchemas } from './schemas/purchasesSchemas.js';

export default fp(async function purchasesPlugin(fastify, opts) {
  // Only register schemas that have a $id
  for (const key in purchasesSchemas) {
    const schema = purchasesSchemas[key];
    if (schema.$id) {
      fastify.addSchema(schema);
    }
  }
  fastify.register(routes, { prefix: '/purchases' });
});
