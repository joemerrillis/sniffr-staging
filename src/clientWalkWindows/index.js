import fp from 'fastify-plugin';
import routes from './routes.js';

// clientWalkWindows plugin: manage client scheduling windows
export default fp(async function clientWalkWindows(fastify, opts) {
  fastify.register(routes, { prefix: '/client-windows' });
});
