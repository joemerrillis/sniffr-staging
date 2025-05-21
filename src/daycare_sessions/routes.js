// src/daycare_sessions/routes.js
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/daycareSessionsController.js';

import { daycareSessionSchemas } from './schemas/daycareSessionsSchemas.js';

export default async function routes(fastify, opts) {
  // Register schemas ONLY if not already registered
  if (!fastify.getSchema('DaycareSession')) {
    fastify.addSchema(daycareSessionSchemas.DaycareSession);
  }
  if (!fastify.getSchema('CreateDaycareSession')) {
    fastify.addSchema(daycareSessionSchemas.CreateDaycareSession);
  }
  if (!fastify.getSchema('UpdateDaycareSession')) {
    fastify.addSchema(daycareSessionSchemas.UpdateDaycareSession);
  }

  // List all daycare sessions
  fastify.get('/', {
    schema: {
      tags: ['Daycare Sessions'],
      response: {
        200: {
          type: 'object',
          properties: {
            sessions: {
              type: 'array',
              items: { $ref: 'DaycareSession#' }
            }
          }
        }
      }
    }
  }, list);

  // Retrieve a specific daycare session
  fastify.get('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            session: { $ref: 'DaycareSession#' }
          }
        }
      }
    }
  }, retrieve);

  // Create a daycare session
  fastify.post('/', {
    schema: {
      tags: ['Daycare Sessions'],
      body: { $ref: 'CreateDaycareSession#' },
      response: {
        201: {
          type: 'object',
          properties: {
            session: { $ref: 'DaycareSession#' }
          }
        }
      }
    }
  }, create);

  // Update a daycare session
  fastify.patch('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: { $ref: 'UpdateDaycareSession#' },
      response: {
        200: {
          type: 'object',
          properties: {
            session: { $ref: 'DaycareSession#' }
          }
        }
      }
    }
  }, modify);

  // Delete a daycare session
  fastify.delete('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        204: { type: 'null' }
      }
    }
  }, remove);
}
