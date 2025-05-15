// src/clientWalkRequests/routes.js
import {
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest
} from './controllers/clientWalkRequestsController.js';
import {
  CreateClientWalkRequest,
  UpdateClientWalkRequest
} from './schemas/clientWalkRequestsSchemas.js';

export default async function routes(fastify, opts) {
  // List all requests for current user
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: { $ref: 'RequestsEnvelope#' }
        }
      }
    },
    listRequests
  );

  // Get a single request by ID
  fastify.get(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: { $ref: 'RequestEnvelope#' }
        }
      }
    },
    getRequest
  );

  // Create a new request
  fastify.post(
    '/',
    {
      schema: {
        body: CreateClientWalkRequest,
        response: {
          201: { $ref: 'RequestEnvelope#' }
        }
      }
    },
    createRequest
  );

  // Update an existing request
  fastify.patch(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: UpdateClientWalkRequest,
        response: {
          200: { $ref: 'RequestEnvelope#' }
        }
      }
    },
    updateRequest
  );

  // Delete a request
  fastify.delete(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: { type: 'null' } }
      }
    },
    deleteRequest
  );
}
