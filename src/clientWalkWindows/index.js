// src/clientWalkWindows/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';

// clientWalkWindows plugin: CRUD for the client_walk_windows table
export default fp(async function clientWalkWindowsModule(fastify, opts) {
  fastify.register(routes, { prefix: '/client-windows' });
});
