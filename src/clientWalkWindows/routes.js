// src/clientWalkWindows/routes.js

import {
  listWindows,
  getWindow,
  createWindow,
  updateWindow,
  deleteWindow
} from './controllers/clientWalkWindowsController.js';
import {
  CreateClientWalkWindow,
  UpdateClientWalkWindow
} from './schemas/clientWalkWindowsSchemas.js';

export default async function routes(fastify, opts) {
  // 1) List all windows (optionally filter by week_start)
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            week_start: { type: 'string', format: 'date' }
          }
        },
        response: {
          200: { $ref: 'WindowsEnvelope#' }
        }
      }
    },
    listWindows
  );

  // 2) Get a single window by ID
  fastify.get(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        response: {
          200: { $ref: 'WindowEnvelope#' }
        }
      }
    },
    getWindow
  );

  // 3) Create a new window
  fastify.post(
    '/',
    {
      schema: {
        body: CreateClientWalkWindow,
        response: {
          201: { $ref: 'WindowEnvelope#' }
        }
      }
    },
    createWindow
  );

  // 4) Update an existing window
  fastify.patch(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        body: UpdateClientWalkWindow,
        response: {
          200: { $ref: 'WindowEnvelope#' }
        }
      }
    },
    updateWindow
  );

  // 5) Delete a window
  fastify.delete(
    '/:id',
    {
      schema: {
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
    },
    deleteWindow
  );
}
