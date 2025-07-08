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
  const publicPrefixes = [
    '/auth',
    '/docs',
    '/dog-memories/test-upload',
    '/dog-memories/upload',
    '/rapi-doc',
    '/audio-test',
    '/audio-test.html',
    '/transcribe',
    '/audio/upload',
    '/api/transcribe',
    '/favicon.ico',
    '/audio',
    '/audio.html',
    '/test-static'
  ];

  fastify.addHook('onRequest', async (request, reply) => {
    const { method, url } = request.raw;

    // Log every incoming request (for debugging)
    // fastify.log.info({ url, method }, 'Request received at JWT hook');

    // Health check root GET/HEAD
    if (url === '/' && (method === 'GET' || method === 'HEAD')) {
      return;
    }

    // Skip all common static files by extension
    if (url.match(/\.(html|js|css|png|jpg|jpeg|gif|webm|svg|ico)$/)) {
      fastify.log.info({ url, method }, 'Static file route, skipping JWT check');
      return;
    }

    // Allow unauthenticated access to anything matching a public prefix
    if (publicPrefixes.some(path => url === path || url.startsWith(path + '/'))) {
      fastify.log.info({ url, method }, 'Public route hit, skipping JWT check');
      return;
    }

    // Handle trailing slash edge case
    if (url.replace(/\/$/, '') === '/dog-memories/upload') {
      fastify.log.info({ url, method }, 'Public route hit (trailing slash), skipping JWT check');
      return;
    }

    // All others require JWT
    await fastify.authenticate(request, reply);
  });
});
