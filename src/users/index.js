import fp from 'fastify-plugin';
import usersRoutes from './routes.js';

export default fp(async function usersPlugin(fastify, opts) {
  fastify.register(usersRoutes, { prefix: '/users' });
});