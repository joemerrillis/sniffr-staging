// src/clientWalkWindows/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  ClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope
} from './schemas/clientWalkWindowsSchemas.js';

export default fp(async function clientWalkWindowsModule(fastify, opts) {
  // register only schemas that have an $id
  fastify.addSchema(ClientWalkWindow);
  fastify.addSchema(WindowsEnvelope);
  fastify.addSchema(WindowEnvelope);

  // now mount our routes under whatever prefix was passed in
  fastify.register(routes, opts);
});
