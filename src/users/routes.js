import { userSchemas } from './schemas/users.js';
import { list, retrieve, modify, remove } from './controllers/usersController.js';

export default async function usersRoutes(fastify, opts) {
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: { users: { type: 'array', items: userSchemas.User } }
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
      response: { 200: userSchemas.User }
    }
  }, retrieve);

  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: userSchemas.UpdateUser,
      response: { 200: userSchemas.User }
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