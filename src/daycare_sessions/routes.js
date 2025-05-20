import { daycareSessionSchemas } from './schemas/daycareSessionsSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/daycareSessionsController.js';

export default async function routes(fastify, opts) {
  // List
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid' },
          dog_id:    { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            sessions: { type: 'array', items: daycareSessionSchemas.DaycareSession }
          }
        }
      }
    }
  }, list);

  // Get single
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
          properties: { session: daycareSessionSchemas.DaycareSession }
        }
      }
    }
  }, retrieve);

  // Create
  fastify.post('/', {
    schema: {
      body: daycareSessionSchemas.CreateDaycareSession,
      response: {
        201: {
          type: 'object',
          properties: { session: daycareSessionSchemas.DaycareSession }
        }
      }
    }
  }, create);

  // Update
  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: daycareSessionSchemas.UpdateDaycareSession,
      response: {
        200: {
          type: 'object',
          properties: { session: daycareSessionSchemas.DaycareSession }
        }
      }
    }
  }, modify);

  // Delete
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
