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
  // List domains (optionally filtered by tenant_id)
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: { tenant_id: { type: 'string', format: 'uuid' } }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            domains: { type: 'array', items: domainSchemas.Domain }
          },
          required: ['domains']
        }
      }
    }
  }, list);

  // Retrieve one domain
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

  // Create a new domain
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

  // Update an existing domain
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

  // Delete a domain
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, remove);

  // Perform CNAME verification
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
};
