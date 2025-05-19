// src/clientWalkWindows/routes.js

import {
  ClientWalkWindow,
  CreateClientWalkWindow,
  UpdateClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope
} from './schemas/clientWalkWindowsSchemas.js';

import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  removeClientWalkWindow
} from './controllers/clientWalkWindowsController.js';

export default async function routes(fastify, opts) {
  // 1) LIST ALL CLIENT WALK WINDOWS
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all client walk windows.',
        tags: ['ClientWalkWindows'],
        response: {
          200: WindowsEnvelope
        }
      }
    },
    listClientWalkWindows
  );

  // 2) GET A SINGLE CLIENT WALK WINDOW BY ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get a client walk window by ID.',
        tags: ['ClientWalkWindows'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: WindowEnvelope
        }
      }
    },
    getClientWalkWindow
  );

  // 3) CREATE A NEW CLIENT WALK WINDOW
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new client walk window.',
        tags: ['ClientWalkWindows'],
        body: CreateClientWalkWindow,
        response: {
          201: WindowEnvelope
        }
      }
    },
    createClientWalkWindow
  );

  // 4) UPDATE AN EXISTING CLIENT WALK WINDOW
  fastify.patch(
    '/:id',
    {
      schema: {
        description: 'Update a client walk window.',
        tags: ['ClientWalkWindows'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: UpdateClientWalkWindow,
        response: {
          200: WindowEnvelope
        }
      }
    },
    updateClientWalkWindow
  );

  // 5) DELETE A CLIENT WALK WINDOW
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete a client walk window.',
        tags: ['ClientWalkWindows'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: {} }
      }
    },
    removeClientWalkWindow
  );
}
