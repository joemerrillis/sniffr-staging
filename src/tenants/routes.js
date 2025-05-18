// src/tenants/routes.js

import { tenantSchemas } from './schemas/tenants.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/tenantsController.js';

export default async function tenantsRoutes(fastify, opts) {
  // List all tenants
  fastify.get('/', {
    schema: {
      description: 'List all tenants.',
      tags: ['Tenants'],
      response: {
        200: {
          type: 'object',
          properties: {
            tenants: {
              type: 'array',
              items: tenantSchemas.Tenant
            }
          },
          required: ['tenants']
        }
      }
    }
  }, list);

  // Retrieve a single tenant
  fastify.get('/:id', {
    schema: {
      description: 'Get tenant by ID.',
      tags: ['Tenants'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tenant: tenantSchemas.Tenant
          },
          required: ['tenant']
        }
      }
    }
  }, retrieve);

  // Create a new tenant (protected)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Create a new tenant.',
      tags: ['Tenants'],
      body: tenantSchemas.CreateTenant,
      response: {
        201: {
          type: 'object',
          properties: {
            tenant: tenantSchemas.Tenant,
            employee: {
              type: 'object',
              properties: {
                id:         { type: 'string', format: 'uuid' },
                tenant_id:  { type: 'string', format: 'uuid' },
                user_id:    { type: 'string', format: 'uuid' },
                is_primary: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' }
              },
              required: ['id','tenant_id','user_id','is_primary','created_at']
            }
          },
          required: ['tenant', 'employee']
        }
      }
    }
  }, create);

  // Update a tenant (protected)
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Update a tenant.',
      tags: ['Tenants'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: tenantSchemas.UpdateTenant,
      response: {
        200: {
          type: 'object',
          properties: {
            tenant: tenantSchemas.Tenant
          },
          required: ['tenant']
        }
      }
    }
  }, modify);

  // Delete a tenant (protected)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Delete a tenant.',
      tags: ['Tenants'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        204: {} // No body, no type, just a blank object (fixes Fastify/Swagger bug)
      }
    }
  }, remove);
}
