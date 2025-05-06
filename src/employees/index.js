const fp = require('fastify-plugin');

module.exports = fp(async function employeesModule(fastify, opts) {
  // Register routes
  fastify.register(require('./routes'));
});
