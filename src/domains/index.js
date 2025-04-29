import fp from 'fastify-plugin';
import domainsRoutes from './routes.js';

export default fp(async function domainsPlugin(fastify, opts) {
  fastify.register(domainsRoutes, { prefix: '/domains' });
});