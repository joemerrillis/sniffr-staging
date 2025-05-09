import fp from 'fastify-plugin';
import routes from './routes.js';

// clientWalkers plugin: CRUD for the client_walkers table
export default fp(async function clientWalkersModule(fastify, opts) {
  fastify.register(routes);
});
