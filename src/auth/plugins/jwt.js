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

    // Allow unauthenticated access to:
    //  - Health check: GET or HEAD on '/'
    //  - All /auth routes (login, register, etc.)
    //  - All /docs and /docs/json (Swagger UI and OpenAPI spec)
    if (
      (url === '/' && (method === 'GET' || method === 'HEAD')) ||
      url.startsWith('/auth') ||
      url.startsWith('/docs')
    ) {
      return;
    }

    // Everything else requires a valid JWT
    await fastify.authenticate(request, reply);
  });
});
