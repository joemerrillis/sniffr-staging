// src/boardings/routes.js

import { boardingSchemas } from './schemas/boardingsSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/boardingsController.js';

export default async function boardingsRoutes(fastify, opts) {
  // 1) LIST ALL BOARDINGS (by tenant, client, or booking)
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all boardings for a tenant (optionally filter by user or booking).',
        tags: ['Boardings'],
        querystring: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
            user_id:   { type: 'string', format: 'uuid' },
            booking_id:{ type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              boardings: {
                type: 'array',
                items: boardingSchemas.Boarding
              }
            },
            required: ['boardings']
          }
        }
      }
    },
    list
  );

  // 2) GET A SINGLE BOARDING BY ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Retrieve a boarding by ID (includes dogs array).',
        tags: ['Boardings'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: { boarding: boardingSchemas.Boarding },
            required: ['boarding']
          }
        }
      }
    },
    retrieve
  );

  // 3) CREATE BOARDING (accepts dogs array, returns service_dogs & breakdown)
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new boarding (with multiple dogs).',
        tags: ['Boardings'],
        body: boardingSchemas.CreateBoarding,
        response: {
          201: boardingSchemas.BoardingResponseEnvelope
        }
      }
    },
    create
  );

  // 4) UPDATE BOARDING (accepts dogs array, returns service_dogs & breakdown)
  fastify.patch(
    '/:id',
    {
      schema: {
        description: 'Update a boarding (and its set of dogs).',
        tags: ['Boardings'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: boardingSchemas.UpdateBoarding,
        response: {
          200: boardingSchemas.BoardingResponseEnvelope
        }
      }
    },
    modify
  );

  // 5) DELETE BOARDING
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete a boarding (removes service_dogs too).',
        tags: ['Boardings'],
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
