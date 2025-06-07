import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  PricePreview,
  ClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope
} from './schemas/clientWalkWindowsSchemas.js';

export default fp(async function (fastify, opts) {
  // Register PricePreview FIRST so $ref can resolve
  fastify.addSchema(PricePreview);
  fastify.addSchema(ClientWalkWindow);
  fastify.addSchema(WindowsEnvelope);
  fastify.addSchema(WindowEnvelope);
  fastify.register(routes, opts);
});
