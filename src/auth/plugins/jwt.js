// src/auth/plugins/jwt.js
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

export default fp(async function jwtPlugin(fastify, opts) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    fastify.log.error('Missing JWT_SECRET');
    throw new Error('JWT_SECRET is required');
  }

  // 1) Register JWT library
  fastify.register(fastifyJwt, { secret });

  // 2) Decorator to verify JWT
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

// 3) Global onRequest hook that *skips* public paths
fastify.addHook('onRequest', async (request, reply) => {
  const { method, url } = request.raw;

  // List of public (no-auth) paths
  const publicPaths = [
    '/',                         // Health check
    '/auth',                     // All /auth routes
    '/docs',                     // Swagger UI
    '/docs/json',                // Swagger JSON
    '/dog-memories/test-upload', // Your test upload form
    '/dog-memories/upload'       // The direct upload endpoint (for now)
  ];

  // Allow unauthenticated access to: root GET/HEAD, any matching prefix in publicPaths
  if (
    (url === '/' && (method === 'GET' || method === 'HEAD')) ||
    publicPaths.some(path => url === path || url.startsWith(path + '/'))
  ) {
    return;
  }

  // Everything else requires a valid JWT
  await fastify.authenticate(request, reply);
});
