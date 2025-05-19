// src/pendingServices/routes.js

import {
  list,
  seed,
  confirm,
  remove
} from './controllers/pendingServicesController.js';
import {
  PendingServicesEnvelope,
  PendingServiceEnvelope,
  ListQuery,
  SeedQuery
} from './schemas/pendingServicesSchemas.js';

export default async function routes(fastify, opts) {
  // List pending services for a given week
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'List all pending services for a given week.',
        tags: ['PendingServices'],
        querystring: ListQuery,
        response: {
          200: { $ref: 'PendingServicesEnvelope#' }
        }
      }
    },
    list
  );

  // Seed recurring windows into pending_services
  fastify.post(
    '/seed',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Seed recurring walk windows as pending services for the given week.',
        tags: ['PendingServices'],
        querystring: SeedQuery,
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } },
            required: ['success']
          }
        }
      }
    },
    seed
  );

  // Confirm (mark paid) a pending service
  fastify.patch(
    '/:id/confirm',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Mark a pending service as confirmed (paid).',
        tags: ['PendingServices'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: { $ref: 'PendingServiceEnvelope#' }
        }
      }
    },
    confirm
  );

  // Delete (cancel) a pending service
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Delete (cancel) a pending service.',
        tags: ['PendingServices'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: {} }
      }
    },
    remove
  );
}
