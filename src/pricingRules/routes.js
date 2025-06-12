// src/pricingRules/routes.js

import {
  getRules,
  postRule,
  patchRule,
  deleteRule
} from './controllers/pricingRulesController.js';

import { previewPriceHandler } from './controllers/previewPriceController.js';

import { pricingRuleSchemas } from './schemas/pricingRulesSchemas.js';

export default async function pricingRulesRoutes(fastify, opts) {
  // Register schemas for Swagger
  fastify.addSchema(pricingRuleSchemas.PricingRule);
  fastify.addSchema(pricingRuleSchemas.CreatePricingRule);

  // CRUD routes
  fastify.get('/', {
    schema: {
      tags: ['PricingRules'],
      querystring: { type: 'object', properties: { tenant_id: { type: 'string', format: 'uuid' } }, required: ['tenant_id'] },
      response: { 200: { type: 'object', properties: { rules: { type: 'array', items: pricingRuleSchemas.PricingRule } } } }
    }
  }, getRules);

  fastify.post('/', {
    schema: {
      tags: ['PricingRules'],
      body: pricingRuleSchemas.CreatePricingRule,
      response: { 201: { type: 'object', properties: { rule: pricingRuleSchemas.PricingRule } } }
    }
  }, postRule);

  fastify.patch('/:id', {
    schema: {
      tags: ['PricingRules'],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      body: { type: 'object', properties: { name: { type: 'string' }, ...pricingRuleSchemas.PricingRule.properties }, additionalProperties: true },
      response: { 200: { type: 'object', properties: { rule: pricingRuleSchemas.PricingRule } } }
    }
  }, patchRule);

  fastify.delete('/:id', {
    schema: {
      tags: ['PricingRules'],
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      response: { 204: {} }
    }
  }, deleteRule);

  // Preview route
  fastify.post('/preview-price', {
    schema: {
      tags: ['PricingRules'],
      body: {
        type: 'object',
        required: ['tenant_id', 'service_type'],
        properties: {
          tenant_id: { type: 'string', format: 'uuid' },
          service_type: { type: 'string', enum: ['boarding', 'walk', 'daycare'] },
          drop_off_day: { type: 'string', format: 'date' },
          pick_up_day: { type: 'string', format: 'date' },
          dog_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
          walk_date: { type: 'string', format: 'date' },
          walk_length_minutes: { type: 'integer' },
          session_date: { type: 'string', format: 'date' }
          // add more fields as you add more service types
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            price: { type: 'number' },
            breakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  rule_type: { type: 'string' },
                  description: { type: ['string', 'null'] },
                  adjustment: { type: 'number' },
                  price_so_far: { type: 'number' }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            missing_fields: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }, previewPriceHandler);
}
