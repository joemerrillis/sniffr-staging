import fp from 'fastify-plugin';
import routes from './routes.js';
import { daycareSessionSchemas } from './schemas/daycareSessionsSchemas.js';

export default fp(async function daycareSessionsPlugin(fastify, opts) {
  // Register schemas (for response validation)
 

  // Register routes
  fastify.register(routes, { prefix: '/daycare_sessions' });
});
