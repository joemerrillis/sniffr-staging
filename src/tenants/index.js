import fp from 'fastify-plugin';
import tenantsRoutes from './routes.js';

export default fp(async function tenantsPlugin(fastify, opts) {
  fastify.register(tenantsRoutes, { prefix: '/tenants' });
});