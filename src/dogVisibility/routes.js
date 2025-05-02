import { dogVisibilitySchemas } from './schemas/dogVisibility.js';
import {
  getVisibility,
  updateVisibility
} from './controllers/dogVisibilityController.js';


 export default async function visibilityRoutes(fastify, opts) {
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

  // Toggle visibility
  fastify.patch('/:id/visibility', {
    schema: {
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
  }, updateVisibility);
}
