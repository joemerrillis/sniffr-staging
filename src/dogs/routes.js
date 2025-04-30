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
            dogs: { type: 'array', items: dogSchemas.Dog }
          },
          required: ['dogs']
        }
      }
    }
  }, list);

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
          properties: { dog: dogSchemas.Dog },
          required: ['dog']
        }
      }
    }
  }, retrieve);

  fastify.post('/', {
    schema: {
      body: dogSchemas.CreateDog,
      response: {
        201: {
          type: 'object',
          properties: { dog: dogSchemas.Dog },
          required: ['dog']
        }
      }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
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
        }
      }
    }
  }, modify);

  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, remove);

  fastify.post('/:id/photo-upload-url', {
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
            uploadUrl: { type: 'string', format: 'uri' },
            uploadMethod: { type: 'string' },
            uploadHeaders: { type: 'object' },
            publicUrl: { type: 'string', format: 'uri' }
          },
          required: ['uploadUrl','uploadMethod','uploadHeaders','publicUrl']
        }
      }
    }
  }, photoUploadUrl);

  fastify.get('/owners/:ownerId/media/export', {
    schema: {
      params: {
        type: 'object',
        properties: { ownerId: { type: 'string', format: 'uuid' } },
        required: ['ownerId']
      }
    }
  }, exportOwnerMedia);
}