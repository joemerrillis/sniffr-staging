import fp from 'fastify-plugin';

export default fp(function errorHandler(fastify, opts, next) {
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    const status = error.statusCode || 500;
    reply.status(status).send({
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      }
    });
  });
  next();
});
