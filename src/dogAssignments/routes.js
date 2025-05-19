// src/dogAssignments/routes.js

import { assignmentSchemas } from './schemas/dogAssignmentsSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/dogAssignmentsController.js';

export default async function routes(fastify, opts) {
  // 1) LIST ASSIGNMENTS
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all dog assignments, optionally filtered by dog, walker, or source.',
        tags: ['DogAssignments'],
        querystring: {
          type: 'object',
          properties: {
            dog_id: { type: 'string', format: 'uuid' },
            walker_id: { type: 'string', format: 'uuid' },
            source: { type: 'string', enum: ['tenant', 'owner'] }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              assignments: { type: 'array', items: assignmentSchemas.Assignment }
            },
            required: ['assignments']
          }
        }
      }
    },
    list
  );

  // 2) GET SINGLE ASSIGNMENT
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get a single dog assignment by ID.',
        tags: ['DogAssignments'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: assignmentSchemas.Assignment
        }
      }
    },
    retrieve
  );

  // 3) CREATE ASSIGNMENT
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new dog assignment.',
        tags: ['DogAssignments'],
        body: assignmentSchemas.CreateAssignment,
        response: {
          201: assignmentSchemas.Assignment
        }
      }
    },
    create
  );

  // 4) UPDATE ASSIGNMENT
  fastify.patch(
    '/:id',
    {
      schema: {
        description: 'Update an existing dog assignment.',
        tags: ['DogAssignments'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: assignmentSchemas.UpdateAssignment,
        response: {
          200: assignmentSchemas.Assignment
        }
      }
    },
    modify
  );

  // 5) DELETE ASSIGNMENT
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete a dog assignment.',
        tags: ['DogAssignments'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: { type: 'null' } }
      }
    },
    remove
  );
}
