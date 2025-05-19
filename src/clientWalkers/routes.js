import {
  list,
  get,
  create,
  update,
  remove
} from './controllers/clientWalkersController.js';
import {
  ClientWalker,
  CreateClientWalker,
  UpdateClientWalker
} from './schemas/clientWalkersSchemas.js';

export default async function routes(fastify, opts) {
  fastify.get('/', {
    schema: {
      description: 'List all client-walker relationships.',
      tags: ['ClientWalkers'],
      response: { 200: { type: 'array', items: ClientWalker } }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      description: 'Retrieve a client-walker relationship by ID.',
      tags: ['ClientWalkers'],
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
      description: 'Create a new client-walker relationship.',
      tags: ['ClientWalkers'],
      body: CreateClientWalker,
      response: { 201: ClientWalker }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
      description: 'Update an existing client-walker relationship.',
      tags: ['ClientWalkers'],
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
      description: 'Delete a client-walker relationship.',
      tags: ['ClientWalkers'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 204: {} }
    }
  }, remove);
}
