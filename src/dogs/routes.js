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
      description: 'List all dogs.',
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
            dogs: { type: 'array', items: dogSchemas.Dog }
          },
          required: ['dogs']
        }
      }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      description: 'Get dog by ID.',
      tags: ['Dogs'],
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
      description: 'Create dog.',
      tags: ['Dogs'],
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
      description: 'Update dog.',
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
        }
      }
    }
  }, modify);

  // ** THE CRUCIAL FIX IS RIGHT HERE **
  fastify.delete('/:id', {
    schema: {
      description: 'Delete dog.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        204: {} // No schema at all. No type, no properties, not even description.
      }
    }
  }, remove);

  fastify.post('/:id/photo-upload-url', {
    schema: {
      description: 'Get signed photo upload URL.',
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
        }
      }
    }
  }, photoUploadUrl);

  fastify.get('/owners/:ownerId/media/export', {
    schema: {
      description: 'Export owner media.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { ownerId: { type: 'string', format: 'uuid' } },
        required: ['ownerId']
      },
      response: {
        200: {
          type: 'object',
          properties: { url: { type: 'string', format: 'uri' } },
          required: ['url']
        }
      }
    }
  }, exportOwnerMedia);

  // === NEW: Dog Personality Route ===
  fastify.post('/:id/personality', {
    schema: {
      description: 'Query and return a dog’s personality profile based on embedded chat history.',
      tags: ['Dogs'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 1, maximum: 30, default: 10 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            dog_id: { type: 'string' },
            personalitySummary: { type: 'string' },
            personality_snippets: { type: 'array', items: { type: 'string' } },
            raw_texts: { type: 'array', items: { type: 'string' } },
            meta: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.params;
    const { max } = req.body || {};
    const PERSONALITY_WORKER_URL = "https://sniffr-personality-worker.joemerrillis.workers.dev"; // <--- Replace with your actual URL!
    const res = await fetch(PERSONALITY_WORKER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dog_id: id, max }),
    });
    if (!res.ok) {
      return reply.code(500).send({ error: "Personality worker failed", details: await res.text() });
    }
    const result = await res.json();
    return reply.send(result);
  });
}
