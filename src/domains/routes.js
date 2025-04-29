// src/domains/routes.js
import { domainSchemas } from './schemas/domains.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove,
  verify
} from './controllers/domainsController.js';

export default async function domainsRoutes(fastify, opts) {
  // 1) LIST
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            domains: {
              type: 'array',
              items: domainSchemas.Domain
            }
          },
          required: ['domains']
        }
      }
    }
  }, list);

  // 2) RETRIEVE SINGLE
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
            domain: domainSchemas.Domain
          },
          required: ['domain']
        }
      }
    }
  }, retrieve);

  // 3) CREATE
  fastify.post('/', {
    schema: {
      body: domainSchemas.CreateDomain,
      response: {
        201: {
          type: 'object',
          properties: {
            domain: domainSchemas.Domain
          },
          required: ['domain']
        }
      }
    }
  }, create);

  // 4) UPDATE
  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: domainSchemas.UpdateDomain,
      response: {
        200: {
          type: 'object',
          properties: {
            domain: domainSchemas.Domain
          },
          required: ['domain']
        }
      }
    }
  }, modify);

  // 5) DELETE
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, remove);

  // 6) VERIFY CNAME
  fastify.post('/:id/verify', {
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
            domain: domainSchemas.Domain
          },
          required: ['domain']
        }
      }
    }
  }, verify);
}
