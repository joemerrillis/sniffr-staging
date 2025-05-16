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
  // 1) List pending services for a given week
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: ListQuery,
        response: {
          200: { $ref: 'PendingServicesEnvelope#' }
        }
      }
    },
    list
  );

  // 2) Seed recurring windows into pending_services
  fastify.post(
    '/seed',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: SeedQuery,
        response: {
          200: {
            type: 'object',
            properties: { success: { type: 'boolean' } }
          }
        }
      }
    },
    seed
  );

  // 3) Confirm (mark paid) a pending service
  fastify.patch(
    '/:id/confirm',
    {
      preHandler: [fastify.authenticate],
      schema: {
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

  // 4) Delete (cancel) a pending service
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: { type: 'null' } }
      }
    },
    remove
  );
}
