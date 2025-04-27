import fp from 'fastify-plugin';

export default fp(function (fastify, opts, next) {
  fastify.decorate('authorizeRoles', function(...allowedRoles) {
    return async function(request, reply) {
      await request.jwtVerify();
      const { role } = request.user;
      if (!allowedRoles.includes(role)) {
        return reply.code(403).send({ error: 'Forbidden: insufficient role' });
      }
    };
  });
  next();
});
