// src/tenantClients/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';

// tenantClients plugin: CRUD for the tenant_clients table
// All routes are mounted under /tenant-clients, avoiding conflicts on '/'
export default fp(async function tenantClientsModule(fastify, opts) {
  fastify.register(routes, { prefix: '/tenant-clients' });
});
