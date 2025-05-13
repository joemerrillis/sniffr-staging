// src/clientWalkWindows/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  ClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope
} from './schemas/clientWalkWindowsSchemas.js';

export default fp(async function clientWalkWindowsModule(fastify, opts) {
  // Register schemas by their $id so Fastify can resolve $ref
  fastify.addSchema(ClientWalkWindow);
  fastify.addSchema(WindowsEnvelope);
  fastify.addSchema(WindowEnvelope);

  // Mount routes under the prefix you pass in (e.g. '/client-windows')
  fastify.register(routes, opts);
});
