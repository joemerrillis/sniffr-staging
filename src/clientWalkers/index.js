// src/clientWalkers/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';

// clientWalkers plugin: mounts all of its routes under /client-walkers
export default fp(async function clientWalkersModule(fastify, opts) {
  // hard‐code the prefix here, so nested GET '/' becomes GET /client-walkers/
  fastify.register(routes, { prefix: '/client-walkers' });
});
