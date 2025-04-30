import fp from 'fastify-plugin';
import dogsRoutes from './routes.js';

export default fp(async function dogsPlugin(fastify, opts) {
  fastify.register(dogsRoutes, { prefix: '/dogs' });
});