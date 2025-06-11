import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
} from '../../pricingRules/controllers/pricingRulesController.js';

import {
  listBoardingPricing,
  createBoardingPricing,
} from '../controllers/boardingPricingController.js';


export default async function boardingsRoutes(fastify, opts) {
  // ...existing boarding/price preview routes...

  // List all pricing rules for a tenant
  fastify.get('/pricing-rules', {
    schema: {
      tags: ['Boardings', 'Pricing'],
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid' }
        },
        required: ['tenant_id']
      }
    }
  }, listPricingRules);

  // Create a new pricing rule
  fastify.post('/pricing-rules', {
    schema: {
      tags: ['Boardings', 'Pricing'],
      body: {
        type: 'object',
        required: ['tenant_id', 'name', 'rule_type', 'price_adjustment_type', 'price_adjustment_value'],
        properties: {
          tenant_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          priority: { type: 'integer' },
          rule_type: { type: 'string' },
          rule_data: { type: 'object' },
          price_adjustment_type: { type: 'string' },
          price_adjustment_value: { type: 'number' },
          enabled: { type: 'boolean' },
          description: { type: 'string' }
        }
      }
    }
  }, createPricingRule);

  // Update an existing rule
  fastify.patch('/pricing-rules/:id', {
    schema: {
      tags: ['Boardings', 'Pricing'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          priority: { type: 'integer' },
          rule_type: { type: 'string' },
          rule_data: { type: 'object' },
          price_adjustment_type: { type: 'string' },
          price_adjustment_value: { type: 'number' },
          enabled: { type: 'boolean' },
          description: { type: 'string' }
        }
      }
    }
  }, updatePricingRule);

  // Delete a rule
  fastify.delete('/pricing-rules/:id', {
    schema: {
      tags: ['Boardings', 'Pricing'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, deletePricingRule);

  // ...other routes...
};
