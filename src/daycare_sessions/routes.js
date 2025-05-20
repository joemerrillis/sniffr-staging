// src/daycare_sessions/routes.js

import {
  listDaycareSessions,
  getDaycareSession,
  createDaycareSession,
  updateDaycareSession,
  deleteDaycareSession,
} from './controllers/daycareSessionsController.js';

import {
  DaycareSession,
  DaycareSessionEnvelope,
  DaycareSessionListEnvelope,
  CreateDaycareSessionRequest,
  UpdateDaycareSessionRequest,
} from './schemas/daycareSessionsSchemas.js';

export default async function routes(fastify, opts) {
  // List all daycare sessions
  fastify.get('/', {
    schema: {
      tags: ['Daycare Sessions'],
      summary: 'List all daycare sessions',
      response: {
        200: DaycareSessionListEnvelope,
      },
    },
    handler: listDaycareSessions,
  });

  // Create new daycare session
  fastify.post('/', {
    schema: {
      tags: ['Daycare Sessions'],
      summary: 'Create new daycare session',
      body: CreateDaycareSessionRequest,
      response: {
        201: DaycareSessionEnvelope,
      },
    },
    handler: createDaycareSession,
  });

  // Get a single daycare session by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      summary: 'Get daycare session by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        200: DaycareSessionEnvelope,
      },
    },
    handler: getDaycareSession,
  });

  // Update a daycare session
  fastify.patch('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      summary: 'Update daycare session by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      body: UpdateDaycareSessionRequest,
      response: {
        200: DaycareSessionEnvelope,
      },
    },
    handler: updateDaycareSession,
  });

  // Delete a daycare session
  fastify.delete('/:id', {
    schema: {
      tags: ['Daycare Sessions'],
      summary: 'Delete daycare session by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
        required: ['id'],
      },
      response: {
        204: { type: 'null', description: 'No content' },
      },
    },
    handler: deleteDaycareSession,
  });
}
