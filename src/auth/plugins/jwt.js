import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

// JWT plugin: registers @fastify/jwt, decorates authenticate, and adds global hook
export default fp(async function jwtPlugin(fastify, opts) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    fastify.log.error('Missing JWT_SECRET');
    throw new Error('JWT_SECRET is required');
  }

  // 1) Register the JWT library
  fastify.register(fastifyJwt, { secret });

  // 2) Decorate Fastify with `authenticate()` to verify JWT on protected routes
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // 3) Apply the authenticate hook globally on every request after decoration
  fastify.addHook('onRequest', fastify.authenticate);
});
