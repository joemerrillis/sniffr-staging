import fp from 'fastify-plugin';
import visibilityRoutes from './routes.js';

export default fp(async function dogVisibilityPlugin(fastify, opts) {
  fastify.register(visibilityRoutes, { prefix: '/:id/visibility' });
});