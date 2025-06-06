// src/boardings/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';                      // <--- FIXED
import pricingRoutes from './routes/pricingRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';

import { boardingSchemas } from './schemas/boardingsSchemas.js';
import * as pricingRuleSchemas from './schemas/pricingRulesSchemas.js';

export default fp(async function boardingsPlugin(fastify, opts) {
  // Register boardings schemas
  fastify.addSchema(boardingSchemas.Boarding);
  fastify.addSchema(boardingSchemas.CreateBoarding);
  fastify.addSchema(boardingSchemas.UpdateBoarding);

  // Register pricing rule schemas
  for (const key in pricingRuleSchemas) {
    fastify.addSchema(pricingRuleSchemas[key]);
  }

  // Register routes under /boardings
  fastify.register(routes, { prefix: '/boardings' });
  fastify.register(pricingRoutes, { prefix: '/boardings' });
  fastify.register(rulesRoutes, { prefix: '/boardings' });
});
