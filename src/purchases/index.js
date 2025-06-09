import fp from 'fastify-plugin';
import routes from './routes.js';
import { purchasesSchemas } from './schemas/purchasesSchemas.js';
import { Delegation } from './schemas/delegationSchemas.js'; // <-- ADD THIS

export default fp(async function purchasesPlugin(fastify, opts) {
  // Register Delegation first, so $ref will resolve!
  fastify.addSchema(Delegation);

  // Now register all remaining schemas
  for (const key in purchasesSchemas) {
    const schema = purchasesSchemas[key];
    if (schema.$id) {
      fastify.addSchema(schema);
    }
  }
  fastify.register(routes, { prefix: '/purchases' });
});
