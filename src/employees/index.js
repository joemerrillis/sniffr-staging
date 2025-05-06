import fp from 'fastify-plugin';
import routes from './routes.js';

export default fp(async function employeesModule(fastify, opts) {
  fastify.register(routes);
});
