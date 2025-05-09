import {
  list,
  get,
  create,
  update,
  remove
} from './controllers/tenantClientsController.js';
import {
  TenantClient,
  CreateTenantClient,
  UpdateTenantClient
} from './schemas/tenantClientsSchemas.js';

export default async function routes(fastify, opts) {
  fastify.get('/', {
    schema: {
      response: { 200: { type: 'array', items: TenantClient } }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: TenantClient }
    }
  }, get);

  fastify.post('/', {
    schema: {
      body: CreateTenantClient,
      response: { 201: TenantClient }
    }
  }, create);

  fastify.put('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateTenantClient,
      response: { 200: TenantClient }
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
