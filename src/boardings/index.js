// src/boardings/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import { boardingSchemas } from './schemas/boardingsSchemas.js';

export default fp(async function boardingsPlugin(fastify, opts) {
  // Register schemas
  fastify.addSchema(boardingSchemas.Boarding);
  fastify.addSchema(boardingSchemas.CreateBoarding);
  fastify.addSchema(boardingSchemas.UpdateBoarding);

  // Register routes
  fastify.register(routes, opts);
});
