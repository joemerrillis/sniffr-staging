// src/clientWalkWindows/routes.js
import {
  listWindows as list,
  getWindow as get,
  createWindow as create,
  updateWindow as update,
  deleteWindow as remove
} from './controllers/clientWalkWindowsController.js';
import {
  ClientWalkWindow,
  CreateClientWalkWindow,
  UpdateClientWalkWindow
} from './schemas/clientWalkWindowsSchemas.js';

export default async function routes(fastify, opts) {
  fastify.get('/', {
    schema: {
      response: { 200: { type: 'array', items: ClientWalkWindow } }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: ClientWalkWindow }
    }
  }, get);

  fastify.post('/', {
    schema: {
      body: CreateClientWalkWindow,
      response: { 201: ClientWalkWindow }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateClientWalkWindow,
      response: { 200: ClientWalkWindow }
    }
  }, update);

  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, remove);
}
