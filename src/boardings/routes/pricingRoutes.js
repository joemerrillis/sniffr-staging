import { previewBoardingPrice } from './controllers/boardingPricingController.js';

export default async function boardingsRoutes(fastify, opts) {
  // ...existing boarding routes...

  // Preview price endpoint
  fastify.post('/preview-price', {
    schema: {
      description: 'Preview (auto-calculate) boarding price for a tenant with rule engine.',
      tags: ['Boardings', 'Pricing'],
      body: {
        type: 'object',
        required: ['tenant_id', 'drop_off_day', 'pick_up_day'],
        properties: {
          tenant_id: { type: 'string', format: 'uuid' },
          dogs: { type: 'array', items: { type: 'string', format: 'uuid' } },
          drop_off_day: { type: 'string', format: 'date' },
          pick_up_day: { type: 'string', format: 'date' }
          // add more fields here if your rules need them
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            suggested_price: { type: 'number' },
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
        }
      }
    }
  }, previewBoardingPrice);

  // ...existing endpoints...
};
