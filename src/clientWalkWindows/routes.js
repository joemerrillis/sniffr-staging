// src/clientWalkWindows/routes.js

import {
  listWindows,
  getWindow,
  createWindow,
  updateWindow,
  deleteWindow
} from './controllers/clientWalkWindowsController.js';

import {
  ClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope,
  CreateClientWalkWindow,
  UpdateClientWalkWindow
} from './schemas/clientWalkWindowsSchemas.js';

export default async function routes(fastify, opts) {
  // 1) List
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: { $ref: 'WindowsEnvelope#' }
        }
      }
    },
    listWindows
  );

  // 2) Retrieve one
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
          200: { $ref: 'WindowEnvelope#' }
        }
      }
    },
    getWindow
  );

  // 3) Create
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

  // 4) Update
  fastify.patch(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
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

  // 5) Delete
  fastify.delete(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
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
