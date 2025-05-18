import { userSchemas } from './schemas/usersSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/usersController.js';

export default async function usersRoutes(fastify, opts) {
  fastify.get('/', {
    schema: {
      description: 'List all users.',
      tags: ['Users'],
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
            users: { type: 'array', items: userSchemas.User }
          },
          required: ['users']
        }
      }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      description: 'Get user by ID.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: { user: userSchemas.User },
          required: ['user']
        }
      }
    }
  }, retrieve);

  fastify.post('/', {
    schema: {
      description: 'Create user.',
      tags: ['Users'],
      body: userSchemas.CreateUser,
      response: {
        201: {
          type: 'object',
          properties: { user: userSchemas.User },
          required: ['user']
        }
      }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
      description: 'Update user.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: userSchemas.UpdateUser,
      response: {
        200: {
          type: 'object',
          properties: { user: userSchemas.User },
          required: ['user']
        }
      }
    }
  }, modify);

  fastify.delete('/:id', {
    schema: {
      description: 'Delete user.',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        204: {} // No content on successful delete
      }
    }
  }, remove);
}
