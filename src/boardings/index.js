import fp from 'fastify-plugin';
import boardingsRoutes from './routes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';

import { boardingSchemas } from './schemas/boardingsSchemas.js';

export default fp(async function boardingsPlugin(fastify, opts) {
  // Register all boardings schemas
  fastify.addSchema(boardingSchemas.Boarding);
  fastify.addSchema(boardingSchemas.CreateBoarding);
  fastify.addSchema(boardingSchemas.UpdateBoarding);

  // Register all routes!
  fastify.register(boardingsRoutes, opts);      // CRUD
  fastify.register(pricingRoutes, opts);        // /preview-price
});
