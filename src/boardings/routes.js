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
  // List boardings (optionally by tenant)
  fastify.get('/', {
    schema: {
      description: 'List all boardings for a tenant.',
      tags: ['Boardings'],
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
            boardings: {
              type: 'array',
              items: boardingSchemas.Boarding
            }
          },
          required: ['boardings']
        }
      }
    }
  }, list);

  // Retrieve single boarding
  fastify.get('/:id', {
    schema: {
      description: 'Retrieve a boarding by ID.',
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
  }, retrieve);

  // Create boarding
  fastify.post('/', {
    schema: {
      description: 'Create a new boarding.',
      tags: ['Boardings'],
      body: boardingSchemas.CreateBoarding,
      response: {
        201: {
          type: 'object',
          properties: { boarding: boardingSchemas.Boarding },
          required: ['boarding']
        }
      }
    }
  }, create);

  // Update boarding
  fastify.patch('/:id', {
    schema: {
      description: 'Update a boarding.',
      tags: ['Boardings'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: boardingSchemas.UpdateBoarding,
      response: {
        200: {
          type: 'object',
          properties: { boarding: boardingSchemas.Boarding },
          required: ['boarding']
        }
      }
    }
  }, modify);

  // Delete boarding
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a boarding.',
      tags: ['Boardings'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 204: {} }
    }
  }, remove);
}
