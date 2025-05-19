// src/dogFriends/routes.js

import { friendSchemas } from './schemas/dogFriendsSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/dogFriendsController.js';

export default async function routes(fastify, opts) {
  // 1) LIST FRIENDSHIPS
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all friendships for a given dog.',
        tags: ['DogFriends'],
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
    },
    list
  );

  // 2) RETRIEVE SINGLE FRIENDSHIP
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Retrieve a friendship by ID.',
        tags: ['DogFriends'],
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
    },
    retrieve
  );

  // 3) CREATE NEW FRIENDSHIP REQUEST
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new friendship request between two dogs.',
        tags: ['DogFriends'],
        body: friendSchemas.CreateFriend,
        response: {
          201: {
            type: 'object',
            properties: { friendship: friendSchemas.Friend },
            required: ['friendship']
          }
        }
      }
    },
    create
  );

  // 4) UPDATE FRIENDSHIP STATUS
  fastify.patch(
    '/:id',
    {
      schema: {
        description: 'Update the status of a friendship (requested, accepted, blocked).',
        tags: ['DogFriends'],
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
    },
    modify
  );

  // 5) DELETE FRIENDSHIP
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete a friendship by ID.',
        tags: ['DogFriends'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: {} }
      }
    },
    remove
  );
}
