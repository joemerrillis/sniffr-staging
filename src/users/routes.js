// src/users/routes.js
import { userSchemas } from './schemas/users.js';
import { list, retrieve, modify, remove } from './controllers/usersController.js';

export default async function usersRoutes(fastify, opts) {
  // List all users: returns { users: [] }
  fastify.get('/', {
    schema: {
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

  // Retrieve single user: wrap in { user: {} }
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: userSchemas.User
          },
          required: ['user']
        }
      }
    }
  }, retrieve);

  // Update user: accept new profile fields, return { user: {} }
  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: userSchemas.UpdateUser,
      response: {
        200: {
          type: 'object',
          properties: {
            user: userSchemas.User
          },
          required: ['user']
        }
      }
    }
  }, modify);

  // Delete user: no response body (204 No Content)
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, remove);
};
