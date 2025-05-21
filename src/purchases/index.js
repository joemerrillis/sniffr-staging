import fp from 'fastify-plugin';
import routes from './routes.js';
import { purchasesSchemas } from './schemas/purchasesSchemas.js';

export default fp(async function purchasesPlugin(fastify, opts) {
  fastify.addSchema(purchasesSchemas.Purchase);
  fastify.register(routes, { prefix: '/purchases' });
});
