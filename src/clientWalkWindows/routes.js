import {
  list,
  get,
  create,
  update,
  remove
} from './controllers/clientWalkWindowsController.js';
import {
  Window,
  CreateWindow,
  UpdateWindow
} from './schemas/clientWalkWindowsSchemas.js';

export default async function routes(fastify, opts) {
  fastify.get('/', {
    schema: {
      description: 'List all client walk windows.',
      tags: ['ClientWalkWindows'],
      response: { 200: { type: 'array', items: Window } }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      description: 'Retrieve a client walk window by ID.',
      tags: ['ClientWalkWindows'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: Window }
    }
  }, get);

  fastify.post('/', {
    schema: {
      description: 'Create a new client walk window.',
      tags: ['ClientWalkWindows'],
      body: CreateWindow,
      response: { 201: Window }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
      description: 'Update an existing client walk window.',
      tags: ['ClientWalkWindows'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateWindow,
      response: { 200: Window }
    }
  }, update);

  fastify.delete('/:id', {
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
  }, remove);
}
