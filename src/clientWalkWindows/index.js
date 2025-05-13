// src/clientWalkWindows/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  ClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope,
  CreateClientWalkWindow,
  UpdateClientWalkWindow
} from './schemas/clientWalkWindowsSchemas.js';

export default fp(async function clientWalkWindowsModule(fastify, opts) {
  // 1) Make Fastify aware of all our JSON schemas
  fastify.addSchema(ClientWalkWindow);
  fastify.addSchema(WindowsEnvelope);
  fastify.addSchema(WindowEnvelope);
  fastify.addSchema(CreateClientWalkWindow);
  fastify.addSchema(UpdateClientWalkWindow);

  // 2) Register our routes (the “prefix” comes from how you mount this plugin in index.js)
  fastify.register(routes, opts);
});
