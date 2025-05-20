import {
  listDaycareSessions,
  getDaycareSessionById,
  createDaycareSession,
  updateDaycareSession,
  deleteDaycareSession
} from './controllers/daycareSessionsController.js';

import { daycareSessionSchemas } from './schemas/daycareSessionsSchemas.js';

export default async function routes(fastify, opts) {
  // Register schemas for Swagger
  fastify.addSchema({ ...daycareSessionSchemas.DaycareSession, $id: 'DaycareSession' });

  // List all daycare sessions
  fastify.get('/', {
    schema: {
      tags: ['Daycare Sessions'],
      response: {
        200: {
          type: 'array',
          items: { $ref: 'DaycareSession#' }
        }
      }
    },
    handler: listDaycareSessions
  });

  // Get single session by ID
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
        200: { $ref: 'DaycareSession#' }
      }
    },
    handler: getDaycareSessionById
  });

  // Create a new session
  fastify.post('/', {
    schema: {
      tags: ['Daycare Sessions'],
      body: daycareSessionSchemas.CreateDaycareSession,
      response: {
        201: { $ref: 'DaycareSession#' }
      }
    },
    handler: createDaycareSession
  });

  // Update a session
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
      body: daycareSessionSchemas.UpdateDaycareSession,
      response: {
        200: { $ref: 'DaycareSession#' }
      }
    },
    handler: updateDaycareSession
  });

  // Delete a session
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
        204: {
          description: 'No Content',
          type: 'null'
        }
      }
    },
    handler: deleteDaycareSession
  });
}
