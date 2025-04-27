import fp from 'fastify-plugin';
import jwtPlugin from './plugins/jwt.js';
import roleCheck from './plugins/roleCheck.js';
import authRoutes from './routes.js';

export default fp(async function authPlugin(fastify, opts) {
  fastify.register(jwtPlugin);
  fastify.register(roleCheck);
  fastify.register(authRoutes, { prefix: '/auth' });
});
