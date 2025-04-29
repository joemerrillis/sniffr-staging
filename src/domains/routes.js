import { domainSchemas } from './schemas/domains.js';
import { list, retrieve, create, modify, remove, verify } from './controllers/domainsController.js';

export default async function domainsRoutes(fastify, opts) {
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: { tenant_id: { type: 'string', format: 'uuid' } }
      },
      response: { 200: { type: 'object', properties: { domains: { type: 'array', items: domainSchemas.Domain } } } }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      response: { 200: domainSchemas.Domain }
    }
  }, retrieve);

  fastify.post('/', {
    schema: { body: domainSchemas.CreateDomain, response: { 201: domainSchemas.Domain } }
  }, create);

  fastify.patch('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      body: domainSchemas.UpdateDomain,
      response: { 200: domainSchemas.Domain }
    }
  }, modify);

  fastify.delete('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] }
    }
  }, remove);

  fastify.post('/:id/verify', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      response: { 200: domainSchemas.Domain }
    }
  }, verify);
};