import { dogVisibilitySchemas } from './schemas/dogVisibility.js';
import {
  getVisibility,
  createVisibility,
  updateVisibility,
  deleteVisibility
} from './controllers/dogVisibilityController.js';

export default async function visibilityRoutes(fastify, opts) {
  // Create visibility record for a dog
  fastify.post('/:id/visibility', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: dogVisibilitySchemas.CreateVisibility,     // { is_visible: boolean }
      response: {
        201: {
          type: 'object',
          properties: {
            visibility: dogVisibilitySchemas.Visibility  // { dog_id, is_visible }
          },
          required: ['visibility']
        }
      }
    }
  }, createVisibility);

  // Get current visibility
  fastify.get('/:id/visibility', {
    schema: {
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
  }, getVisibility);

  // Update (toggle) visibility
  fastify.patch('/:id/visibility', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: dogVisibilitySchemas.UpdateVisibility,     // { is_visible: boolean }
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
  }, updateVisibility);

  // Delete visibility record
  fastify.delete('/:id/visibility', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, deleteVisibility);
}
