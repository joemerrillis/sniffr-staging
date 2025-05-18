import { dogSchemas } from './schemas/dogs.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove,
  photoUploadUrl,
  exportOwnerMedia
} from './controllers/dogsController.js';

export default async function dogsRoutes(fastify, opts) {
  fastify.get('/', {
    schema: {
      description: 'List all dogs. Optionally filter by tenant or owner.',
      tags: ['Dogs'],
      querystring: {
        type: 'object',
        properties: {
          tenant_id: { type: 'string', format: 'uuid' },
          owner_id:  { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            dogs: { 
              type: 'array',
              items: dogSchemas.Dog
            }
          },
          required: ['dogs']
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      description: 'Get details about a specific dog by its ID.',
      tags: ['Dogs'],
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
            dog: dogSchemas.Dog
          },
          required: ['dog']
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, retrieve);

  fastify.post('/', {
    schema: {
      description: 'Create a new dog profile.',
      tags: ['Dogs'],
      body: dogSchemas.CreateDog,
      response: {
        201: {
          type: 'object',
          properties: { dog: dogSchemas.Dog },
          required: ['dog']
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
      description: 'Update an existing dog profile.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: dogSchemas.UpdateDog,
      response: {
        200: {
          type: 'object',
          properties: { dog: dogSchemas.Dog },
          required: ['dog']
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, modify);

  // ** THIS IS THE CRITICAL FIX FOR DELETE **
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a dog by its ID.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        204: {
          description: 'Dog deleted successfully'
          // 204 should NOT have type/properties—no body, just status!
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, remove);

  fastify.post('/:id/photo-upload-url', {
    schema: {
      description: 'Generate a signed upload URL to upload a dog’s photo.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            uploadUrl: { type: 'string', format: 'uri' },
            uploadMethod: { type: 'string' },
            uploadHeaders: { type: 'object' },
            publicUrl: { type: 'string', format: 'uri' }
          },
          required: ['uploadUrl','uploadMethod','uploadHeaders','publicUrl']
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, photoUploadUrl);

  fastify.get('/owners/:ownerId/media/export', {
    schema: {
      description: 'Export all media (photos, etc) belonging to the specified owner.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { ownerId: { type: 'string', format: 'uuid' } },
        required: ['ownerId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' }
          },
          required: ['url']
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, exportOwnerMedia);
}
