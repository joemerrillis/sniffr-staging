import fp from 'fastify-plugin';

export default fp(function logger(fastify, opts, next) {
  fastify.addHook('onRequest', (request, reply, done) => {
    fastify.log.info({ url: request.url, method: request.method }, 'Incoming request');
    done();
  });
  next();
});
