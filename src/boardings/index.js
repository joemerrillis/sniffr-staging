import fp from 'fastify-plugin';
import boardingsRoutes from './routes.js';

import { boardingSchemas } from './schemas/boardingsSchemas.js';

export default fp(async function boardingsPlugin(fastify, opts) {
  // Register all boardings schemas
  fastify.addSchema(boardingSchemas.Boarding);
  fastify.addSchema(boardingSchemas.CreateBoarding);
  fastify.addSchema(boardingSchemas.UpdateBoarding);

  // Register just the main boardings CRUD endpoints
  fastify.register(boardingsRoutes, opts);
});
