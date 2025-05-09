import { list, get, create, update, remove } from './controllers/clientWalkersController.js';
import { ClientWalker, CreateClientWalker, UpdateClientWalker } from './schemas/clientWalkersSchemas.js';

export default async function routes(fastify, opts) {
  fastify.get('/', { schema: { response: { 200: { type: 'array', items: ClientWalker } } } }, list);
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: ClientWalker }
    }
  }, get);
  fastify.post('/', {
    schema: {
      body: CreateClientWalker,
      response: { 201: ClientWalker }
    }
  }, create);
  fastify.put('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateClientWalker,
      response: { 200: ClientWalker }
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
