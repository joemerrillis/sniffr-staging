// src/tenantClients/routes.js

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
  // List all tenant-client relationships
  fastify.get('/', {
    schema: {
      description: 'List all tenant-client relationships.',
      tags: ['TenantClients'],
      response: { 200: { type: 'array', items: TenantClient } }
    }
  }, list);

  // Get a single tenant-client relationship by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get a tenant-client relationship by ID.',
      tags: ['TenantClients'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: TenantClient }
    }
  }, get);

  // Create a new tenant-client relationship
  fastify.post('/', {
    schema: {
      description: 'Create a new tenant-client relationship.',
      tags: ['TenantClients'],
      body: CreateTenantClient,
      response: { 201: TenantClient }
    }
  }, create);

  // Update an existing tenant-client relationship
  fastify.put('/:id', {
    schema: {
      description: 'Update an existing tenant-client relationship.',
      tags: ['TenantClients'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateTenantClient,
      response: { 200: TenantClient }
    }
  }, update);

  // Delete a tenant-client relationship
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a tenant-client relationship by ID.',
      tags: ['TenantClients'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        204: {}
      }
    }
  }, remove);
}
