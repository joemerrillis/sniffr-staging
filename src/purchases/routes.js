// src/purchases/routes.js
import {
  checkout,
  list,
  retrieve,
  webhook,
} from './controllers/purchasesController.js';
import { purchasesSchemas } from './schemas/purchasesSchemas.js';

export default async function routes(fastify, opts) {
  // POST /purchases/checkout
  fastify.post(
    '/checkout',
    {
      schema: {
        body: purchasesSchemas.CheckoutRequest,
        response: { 201: purchasesSchemas.CheckoutResponse },
        tags: ['Purchases'],
        summary: 'Initiate purchase and return payment link',
      },
    },
    checkout
  );

  // GET /purchases
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              purchases: {
                type: 'array',
                items: { $ref: 'Purchase#' }
              }
            }
          }
        },
        tags: ['Purchases'],
        summary: 'List purchases for current user or tenant',
      },
    },
    list
  );

  // GET /purchases/:id
  fastify.get(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              purchase: { $ref: 'Purchase#' }
            }
          }
        },
        tags: ['Purchases'],
        summary: 'Get details for a specific purchase',
      },
    },
    retrieve
  );

  // POST /purchases/webhook/:provider
  fastify.post(
    '/webhook/:provider',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['stripe', 'paypal', 'crypto'] }
          },
          required: ['provider']
        },
        body: purchasesSchemas.WebhookPayload,
        response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } },
        tags: ['Purchases'],
        summary: 'Handle payment provider webhooks',
      },
    },
    webhook
  );
}
