import fp from 'fastify-plugin';
import routes from './routes.js';

// walks plugin: scheduling/rescheduling/canceling walks,
// plus day-view, confirmation, and clone-week helpers
export default fp(async function walksModule(fastify, opts) {
  fastify.register(routes, { prefix: '/walks' });
});
