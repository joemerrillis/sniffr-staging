import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  ClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope
} from './schemas/clientWalkWindowsSchemas.js';

export default fp(async function (fastify, opts) {
  fastify.addSchema(ClientWalkWindow);
  fastify.addSchema(WindowsEnvelope);
  fastify.addSchema(WindowEnvelope);
  fastify.register(routes, opts);
});
