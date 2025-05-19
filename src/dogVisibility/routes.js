// src/dogVisibility/routes.js

import { dogVisibilitySchemas } from './schemas/dogVisibility.js';
import {
  getVisibility,
  createVisibility,
  updateVisibility,
  deleteVisibility
} from './controllers/dogVisibilityController.js';

export default async function visibilityRoutes(fastify, opts) {
  // 1) CREATE VISIBILITY RECORD FOR A DOG
  fastify.post(
    '/:id/visibility',
    {
      schema: {
        description: 'Create a visibility record for a dog.',
        tags: ['DogVisibility'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: dogVisibilitySchemas.UpdateVisibility,
        response: {
          201: {
            type: 'object',
            properties: {
              visibility: dogVisibilitySchemas.Visibility
            },
            required: ['visibility']
          }
        }
      }
    },
    createVisibility
  );

  // 2) GET CURRENT VISIBILITY
  fastify.get(
    '/:id/visibility',
    {
      schema: {
        description: 'Get current visibility for a dog.',
        tags: ['DogVisibility'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              visibility: dogVisibilitySchemas.Visibility
            },
            required: ['visibility']
          }
        }
      }
    },
    getVisibility
  );

  // 3) UPDATE (TOGGLE) VISIBILITY
  fastify.patch(
    '/:id/visibility',
    {
      schema: {
        description: 'Update (toggle) visibility for a dog.',
        tags: ['DogVisibility'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: dogVisibilitySchemas.UpdateVisibility,
        response: {
          200: {
            type: 'object',
            properties: {
              visibility: dogVisibilitySchemas.Visibility
            },
            required: ['visibility']
          }
        }
      }
    },
    updateVisibility
  );

  // 4) DELETE VISIBILITY RECORD
  fastify.delete(
    '/:id/visibility',
    {
      schema: {
        description: 'Delete a visibility record for a dog.',
        tags: ['DogVisibility'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        }
      }
    },
    deleteVisibility
  );
}
