import fp from 'fastify-plugin';
import pricingRulesRoutes from './routes.js';

export default fp(async function pricingRulesPlugin(fastify, opts) {
  fastify.register(pricingRulesRoutes, { prefix: '/pricing-rules' });
});
