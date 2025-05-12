import {
  listWindows,
  getWindow,
  createWindow,
  updateWindow,
  deleteWindow
} from './controllers/clientWalkWindowsController.js';
import {
  Window,
  CreateWindow,
  UpdateWindow
} from './schemas/clientWalkWindowsSchemas.js';

export default async function routes(fastify, opts) {
  fastify.get('/', {
    schema: {
      response: { 200: { type: 'array', items: Window } }
    }
  }, listWindows);

  fastify.get('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      response: { 200: Window }
    }
  }, getWindow);

  fastify.post('/', {
    schema: {
      body: CreateWindow,
      response: { 201: Window }
    }
  }, createWindow);

  fastify.patch('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      body: UpdateWindow,
      response: { 200: Window }
    }
  }, updateWindow);

  fastify.delete('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] }
    }
  }, deleteWindow);
}
