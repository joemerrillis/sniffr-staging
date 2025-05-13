// src/clientWalkWindows/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  Window,
  WindowsEnvelope,
  WindowEnvelope
} from './schemas/clientWalkWindowsSchemas.js';

// clientWalkWindows plugin: manage client scheduling windows
export default fp(async function clientWalkWindowsModule(fastify, opts) {
  // Register schemas by their $id so Fastify can resolve $ref
  fastify.addSchema(Window);
  fastify.addSchema(WindowsEnvelope);
  fastify.addSchema(WindowEnvelope);

  // Mount routes under the prefix you pass in (e.g. '/client-windows')
  fastify.register(routes, opts);
});
