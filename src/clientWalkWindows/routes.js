// src/clientWalkWindows/routes.js

import {
  Window,
  CreateClientWalkWindow,
  UpdateClientWalkWindow
} from './schemas/clientWalkWindowsSchemas.js';

import {
  list,
  retrieve,
  create,
  update,
  remove
} from './controllers/clientWalkWindowsController.js';

export default async function clientWalkWindowsRoutes(fastify, opts) {
  // List all client walk windows
  fastify.get('/', {
    schema: {
      description: 'List all client walk windows.',
      tags: ['ClientWalkWindows'],
      response: { 200: { type: 'array', items: Window } }
    }
  }, list);

  // Retrieve a single client walk window
  fastify.get('/:id', {
    schema: {
      description: 'Get a single client walk window by ID.',
      tags: ['ClientWalkWindows'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: Window }
    }
  }, retrieve);

  // Create a new client walk window
  fastify.post('/', {
    schema: {
      description: 'Create a new client walk window.',
      tags: ['ClientWalkWindows'],
      body: CreateClientWalkWindow,
      response: { 201: Window }
    }
  }, create);

  // Update an existing client walk window
  fastify.patch('/:id', {
    schema: {
      description: 'Update a client walk window.',
      tags: ['ClientWalkWindows'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateClientWalkWindow,
      response: { 200: Window }
    }
  }, update);

  // Delete a client walk window
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a client walk window.',
      tags: ['ClientWalkWindows'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 204: {} } // No body on 204
    }
  }, remove);
}
