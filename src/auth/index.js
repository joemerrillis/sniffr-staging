import fp from 'fastify-plugin';
import jwtPlugin from './plugins/jwt.js';
import roleCheck from './plugins/roleCheck.js';
import authRoutes from './routes.js';

// Auth plugin: wires up JWT auth, role-checking, and /auth routes
export default fp(async function authPlugin(fastify, opts) {
  // 1) JWT plugin registers JWT, decorate authenticate, and add global hook
  fastify.register(jwtPlugin);

  // 2) Role-check decorator (no global hook here)
  fastify.register(roleCheck);

  // 3) Auth routes: login, register, me, logout
  fastify.register(authRoutes, { prefix: '/auth' });
});
