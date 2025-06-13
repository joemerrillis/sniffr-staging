// src/clientWalkRequests/routes.js

import {
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
} from './controllers/index.js';

export default async function routes(fastify, opts) {
  // 1) LIST ALL WALK REQUESTS FOR CURRENT USER
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all walk requests for the authenticated client.',
        tags: ['ClientWalkRequests'],
        response: {
          200: { $ref: 'RequestsEnvelope#' },
        },
      },
    },
    listRequests
  );

  // 2) GET A SINGLE WALK REQUEST BY ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get a single walk request by ID.',
        tags: ['ClientWalkRequests'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          200: { $ref: 'RequestEnvelope#' },
        },
      },
    },
    getRequest
  );

  // 3) CREATE A NEW WALK REQUEST
 fastify.post(
  '/',
  {
    schema: {
      description: 'Create a new walk request for a day/time outside regular windows.',
      tags: ['ClientWalkRequests'],
      body: { $ref: 'CreateClientWalkRequest#' },
      response: {
        201: {
          type: 'object',
          properties: {
            walk_request: { $ref: 'ClientWalkRequest#' },
            pending_service: { $ref: 'PendingService#' },
            service_dogs: {
              type: 'array',
              items: { $ref: 'ServiceDog#' }
            },
            price_preview: { $ref: 'PricePreview#' }
          },
          required: ['walk_request', 'pending_service'] // add 'price_preview' if always present
        }
      },
    },
  },
  createRequest
);

  // 4) UPDATE AN EXISTING WALK REQUEST
  fastify.patch(
    '/:id',
    {
      schema: {
        description: 'Update an existing walk request.',
        tags: ['ClientWalkRequests'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        body: { $ref: 'UpdateClientWalkRequest#' },
        response: {
          200: { $ref: 'RequestEnvelope#' },
        },
      },
    },
    updateRequest
  );

  // 5) DELETE A WALK REQUEST
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete a walk request.',
        tags: ['ClientWalkRequests'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: { 204: { type: 'null' } },
      },
    },
    deleteRequest
  );
}
