// src/daycare_sessions/routes.js
import {
  list,
  retrieve,
  create,
  modify,
  remove,
} from './controllers/daycareSessionsController.js';

import { daycareSessionSchemas } from './schemas/daycareSessionsSchemas.js';

export default async function routes(fastify, opts) {
  // Register schemas
  fastify.addSchema(daycareSessionSchemas.DaycareSession);
  fastify.addSchema(daycareSessionSchemas.CreateDaycareSession);
  fastify.addSchema(daycareSessionSchemas.UpdateDaycareSession);

  // List all daycare sessions (optionally filtered)
  fastify.get('/', {
    schema: {
      tags: ['Daycare Sessions'],
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid' },
          dog_id:    { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            sessions: {
              type: 'array',
              items: { $ref: 'DaycareSession#' },
            },
          },
        },
      },
    },
    handler: list,
  });

  // Get a single daycare session by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            session: { $ref: 'DaycareSession#' },
          },
        },
      },
    },
    handler: retrieve,
  });

  // Create a new daycare session
  fastify.post('/', {
    schema: {
      tags: ['Daycare Sessions'],
      body: daycareSessionSchemas.CreateDaycareSession,
      response: {
        201: {
          type: 'object',
          properties: {
            session: { $ref: 'DaycareSession#' },
          },
        },
      },
    },
    handler: create,
  });

  // Update an existing daycare session by ID
  fastify.patch('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      body: daycareSessionSchemas.UpdateDaycareSession,
      response: {
        200: {
          type: 'object',
          properties: {
            session: { $ref: 'DaycareSession#' },
          },
        },
      },
    },
    handler: modify,
  });

  // Delete a daycare session by ID
  fastify.delete('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: { 204: { type: 'null' } },
    },
    handler: remove,
  });
}
