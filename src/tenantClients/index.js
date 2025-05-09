import fp from 'fastify-plugin';
import routes from './routes.js';

// tenantClients plugin: CRUD for the tenant_clients table
export default fp(async function tenantClientsModule(fastify, opts) {
  fastify.register(routes);
});
