import fp from 'fastify-plugin';
import routes from './routes.js';

export default fp(async (fastify) => {
  fastify.register(routes, { prefix: '/dog-assignments' });
});
