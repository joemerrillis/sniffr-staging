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
          tenant_id: { type: 'string', format: 'uuid', description: 'Tenant ID to filter dogs' },
          owner_id:  { type: 'string', format: 'uuid', description: 'Owner ID to filter dogs' }
        }
      },
      response: {
        200: {
          description: 'List of dogs',
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
          description: 'Invalid query parameters',
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
          id: { type: 'string', format: 'uuid', description: 'Dog ID' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Dog details',
          type: 'object',
          properties: {
            dog: dogSchemas.Dog
          },
          required: ['dog']
        },
        404: {
          description: 'Dog not found',
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
      body: {
        ...dogSchemas.CreateDog,
        description: 'Dog profile data to create.',
        examples: [
          {
            owner_id: "6e11a3d2-25d3-4f7d-91db-56e4306b8e38",
            name: "Fido",
            birthdate: "2017-08-13",
            tenant_id: "a0e1a2b3-5e77-49fa-b87e-3bc11b66e184"
          }
        ]
      },
      response: {
        201: {
          description: 'Dog created successfully',
          type: 'object',
          properties: { dog: dogSchemas.Dog },
          required: ['dog']
        },
        400: {
          description: 'Invalid input',
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
        properties: { id: { type: 'string', format: 'uuid', description: 'Dog ID' } },
        required: ['id']
      },
      body: {
        ...dogSchemas.UpdateDog,
        description: 'Dog fields to update',
        examples: [
          { name: "Rover" },
          { birthdate: "2019-05-23" }
        ]
      },
      response: {
        200: {
          description: 'Dog updated',
          type: 'object',
          properties: { dog: dogSchemas.Dog },
          required: ['dog']
        },
        400: {
          description: 'Invalid update data',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Dog not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, modify);

  fastify.delete('/:id', {
    schema: {
      description: 'Delete a dog by its ID.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid', description: 'Dog ID' } },
        required: ['id']
      },
      response: {
        204: {
          description: 'Dog deleted successfully'
          // No 'type' or 'properties' for 204, as it returns no content.
        },
        404: {
          description: 'Dog not found',
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
        properties: { id: { type: 'string', format: 'uuid', description: 'Dog ID' } },
        required: ['id']
      },
      response: {
        200: {
          description: 'Photo upload URL and metadata',
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
          description: 'Dog not found',
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
        properties: { ownerId: { type: 'string', format: 'uuid', description: 'Owner ID' } },
        required: ['ownerId']
      },
      response: {
        200: {
          description: 'Exported media files (typically a downloadable archive or link)',
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' }
          },
          required: ['url']
        },
        404: {
          description: 'Owner not found or no media available',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, exportOwnerMedia);
}
