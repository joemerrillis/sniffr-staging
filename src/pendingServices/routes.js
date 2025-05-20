// src/pendingServices/routes.js

import {
  list,
  retrieve,
  remove,
  listForClient,
  removeForClient
} from './controllers/pendingServicesController.js';

import {
  PendingServicesEnvelope,
  PendingServiceEnvelope
} from './schemas/pendingServicesSchemas.js';

export default async function routes(fastify, opts) {
  // CLIENT: List all pending services for current user
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all pending services in the current user’s cart.',
        tags: ['PendingServices'],
        response: {
          200: PendingServicesEnvelope
        }
      }
    },
    list
  );

  // CLIENT: Get a single pending service by id
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get a single pending service by id.',
        tags: ['PendingServices'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: PendingServiceEnvelope
        }
      }
    },
    retrieve
  );

  // CLIENT: Delete a pending service (remove from cart)
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete (remove) a pending service from the cart.',
        tags: ['PendingServices'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: { type: 'null' } }
      }
    },
    remove
  );

  // TENANT: List all pending services for a specific client
  fastify.get(
    '/tenants/:tenant_id/clients/:client_id/pending-services',
    {
      schema: {
        description: 'Tenant: List all pending services for a specific client.',
        tags: ['TenantPendingServices'],
        params: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
            client_id: { type: 'string', format: 'uuid' }
          },
          required: ['tenant_id', 'client_id']
        },
        response: {
          200: PendingServicesEnvelope
        }
      }
    },
    listForClient
  );

  // TENANT: Delete a pending service for a client (if needed)
  fastify.delete(
    '/tenants/:tenant_id/clients/:client_id/pending-services/:id',
    {
      schema: {
        description: 'Tenant: Delete a pending service for a client.',
        tags: ['TenantPendingServices'],
        params: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
            client_id: { type: 'string', format: 'uuid' },
            id:        { type: 'string', format: 'uuid' }
          },
          required: ['tenant_id', 'client_id', 'id']
        },
        response: { 204: { type: 'null' } }
      }
    },
    removeForClient
  );
}
