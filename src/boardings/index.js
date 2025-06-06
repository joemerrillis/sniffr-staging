import fp from 'fastify-plugin';

// Route modules
import boardingsRoutes from './routes.js'; // This is your "main" boardings route file!
import pricingRoutes from './routes/pricingRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';

// Schemas
import { boardingSchemas } from './schemas/boardingsSchemas.js';
import { pricingRulesSchemas } from './schemas/pricingRulesSchemas.js';

export default fp(async function boardingsPlugin(fastify, opts) {
  // Register core boarding schemas
  fastify.addSchema(boardingSchemas.Boarding);
  fastify.addSchema(boardingSchemas.CreateBoarding);
  fastify.addSchema(boardingSchemas.UpdateBoarding);

  // Register pricing rules schemas if present
  if (pricingRulesSchemas) {
    Object.values(pricingRulesSchemas).forEach(schema => fastify.addSchema(schema));
  }

  // Main boardings CRUD endpoints
  fastify.register(boardingsRoutes, opts);

  // /boardings/pricing
  fastify.register(pricingRoutes, { prefix: '/pricing' });

  // /boardings/rules
  fastify.register(rulesRoutes, { prefix: '/rules' });
});
