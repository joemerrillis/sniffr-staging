import { friendSchemas } from './schemas/dogFriendsSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/dogFriendsController.js';

export default async function routes(fastify, opts) {
  // List friendships
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dog_id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            friendships: { type: 'array', items: friendSchemas.Friend }
          },
          required: ['friendships']
        }
      }
    }
  }, list);

  // Retrieve single friendship
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
          properties: { friendship: friendSchemas.Friend },
          required: ['friendship']
        }
      }
    }
  }, retrieve);

  // Create a new friendship request
  fastify.post('/', {
    schema: {
      body: friendSchemas.CreateFriend,
      response: {
        201: {
          type: 'object',
          properties: { friendship: friendSchemas.Friend },
          required: ['friendship']
        }
      }
    }
  }, create);

  // Update friendship status
  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: friendSchemas.UpdateFriend,
      response: {
        200: {
          type: 'object',
          properties: { friendship: friendSchemas.Friend },
          required: ['friendship']
        }
      }
    }
  }, modify);

  // Delete friendship
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
