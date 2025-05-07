// src/tenants/routes.js

import { tenantSchemas } from './schemas/tenants.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/tenantsController.js';
import { authenticate } from '../auth/plugins/jwt.js';          // for TS/IDE hints
import { Employee } from '../employees/schemas/employeesSchemas.js';

export default async function tenantsRoutes(fastify, opts) {
  // List tenants (public or could be protected as you prefer)
  fastify.get(
    '/',
    {
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
    },
    list
  );

  // Get a single tenant
  fastify.get(
    '/:id',
    {
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
    },
    retrieve
  );

  // **Create tenant** (must be logged in as a tenant_admin)
  fastify.post(
    '/',
    {
      preHandler: [ fastify.authenticate ],
      schema: {
        body: tenantSchemas.CreateTenant,
        response: {
          201: {
            type: 'object',
            properties: {
              tenant:   tenantSchemas.Tenant,
              employee: Employee            // allow the seeded employee
            },
            required: ['tenant', 'employee']
          }
        }
      }
    },
    create
  );

  // **Modify tenant** (protected)
  fastify.patch(
    '/:id',
    {
      preHandler: [ fastify.authenticate ],
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
    },
    modify
  );

  // **Delete tenant** (protected)
  fastify.delete(
    '/:id',
    {
      preHandler: [ fastify.authenticate ],
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        }
      }
    },
    remove
  );
}
