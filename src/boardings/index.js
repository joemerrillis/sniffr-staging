// src/boardings/index.js

import fp from 'fastify-plugin';
import routes from './routes/routes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';

import { boardingSchemas } from './schemas/boardingsSchemas.js';
import * as pricingRuleSchemas from './schemas/pricingRulesSchemas.js';

export default fp(async function boardingsPlugin(fastify, opts) {
  // Register boardings schemas
  fastify.addSchema(boardingSchemas.Boarding);
  fastify.addSchema(boardingSchemas.CreateBoarding);
  fastify.addSchema(boardingSchemas.UpdateBoarding);

  // Register pricing rule schemas (add all, for Swagger completeness)
  for (const key in pricingRuleSchemas) {
    fastify.addSchema(pricingRuleSchemas[key]);
  }

  // Register boardings core routes (at /boardings/*)
  fastify.register(routes, { prefix: '/boardings' });

  // Register pricing rules routes (at /boardings/pricing-rules)
  fastify.register(pricingRoutes, { prefix: '/boardings' });

  // Register advanced/custom rules (optional, e.g. /boardings/rules)
  fastify.register(rulesRoutes, { prefix: '/boardings' });
});
