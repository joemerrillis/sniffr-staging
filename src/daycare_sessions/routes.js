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
  // Register all schemas for $ref resolution
  Object.values(daycareSessionSchemas).forEach(s => fastify.addSchema(s));

  // GET /daycare_sessions
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
           dog_ids: {
  type: 'array',
  items: { type: 'string', format: 'uuid' }
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
        tags: ['DaycareSessions'],
        summary: 'List daycare sessions',
      },
    },
    list
  );

  // GET /daycare_sessions/:id
  fastify.get(
    '/:id',
    {
      schema: {
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
        tags: ['DaycareSessions'],
        summary: 'Get a daycare session by ID',
      },
    },
    retrieve
  );

  // POST /daycare_sessions (envelope response!)
  fastify.post(
    '/',
    {
      schema: {
        body: { $ref: 'CreateDaycareSession#' },
        response: {
          201: { $ref: 'DaycareSessionEnvelope#' }
        },
        tags: ['DaycareSessions'],
        summary: 'Create a daycare session',
      },
    },
    create
  );

  // PATCH /daycare_sessions/:id
  fastify.patch(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: { $ref: 'UpdateDaycareSession#' },
        response: {
          200: {
            type: 'object',
            properties: {
              session: { $ref: 'DaycareSession#' },
            },
          },
        },
        tags: ['DaycareSessions'],
        summary: 'Update a daycare session',
      },
    },
    modify
  );

  // DELETE /daycare_sessions/:id
  fastify.delete(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          204: { type: 'null' },
        },
        tags: ['DaycareSessions'],
        summary: 'Delete a daycare session',
      },
    },
    remove
  );
}
