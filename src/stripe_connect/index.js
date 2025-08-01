// index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import { stripeConnectSchemas } from './schemas/stripeConnectSchemas.js';

export default fp(async function stripeConnectPlugin(fastify, opts) {
  for (const schema of Object.values(stripeConnectSchemas)) {
    try {
      fastify.addSchema(schema);
    } catch (e) {
      // Ignore duplicate schema registration errors
    }
  }
  fastify.register(routes);
});
