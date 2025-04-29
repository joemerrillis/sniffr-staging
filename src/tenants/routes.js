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
  fastify.get('/', {
    schema: {
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

  fastify.get('/:id', {
    schema: {
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

  fastify.post('/', {
    schema: {
      body: tenantSchemas.CreateTenant,
      response: {
        201: {
          type: 'object',
          properties: {
            tenant: tenantSchemas.Tenant
          },
          required: ['tenant']
        }
      }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
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

  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, remove);
};
