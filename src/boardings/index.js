import fp from 'fastify-plugin';
import boardingsRoutes from './routes/routes.js';                   // your main boardings routes
import pricingRoutes from './routes/pricingRoutes.js';              // pricing endpoints
import rulesRoutes from './routes/rulesRoutes.js';                  // pricing rules endpoints

import { boardingSchemas } from './schemas/boardingsSchemas.js';
import { pricingRulesSchemas } from './schemas/pricingRulesSchemas.js';

export default fp(async function boardingsPlugin(fastify, opts) {
  // Register core boarding schemas
  fastify.addSchema(boardingSchemas.Boarding);
  fastify.addSchema(boardingSchemas.CreateBoarding);
  fastify.addSchema(boardingSchemas.UpdateBoarding);

  // Register pricing rules schemas (if you have them)
  if (pricingRulesSchemas) {
    Object.values(pricingRulesSchemas).forEach(schema => fastify.addSchema(schema));
  }

  // Mount main boardings routes (should include CRUD for /boardings)
  fastify.register(boardingsRoutes, opts);

  // Mount pricing calculation routes (e.g. /boardings/pricing)
  fastify.register(pricingRoutes, { prefix: '/pricing' });

  // Mount rules management routes (e.g. /boardings/rules)
  fastify.register(rulesRoutes, { prefix: '/rules' });
});
