import fp from 'fastify-plugin';
import friendsRoutes from './routes.js';

export default fp(async (fastify) => {
  fastify.register(friendsRoutes, { prefix: '/dog-friends' });
});
