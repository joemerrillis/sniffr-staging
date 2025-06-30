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
        204: {}
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
    max: { type: 'integer', minimum: 1, maximum: 30, default: 10 },
    embedding_id: { type: 'string', description: 'Optionally use a specific embedding as the search vector' }
  }
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
            raw_matches: { type: 'array', items: { type: 'object' } } // Use "raw_matches" if your worker returns this!
          }
        }
      }
    }
  }, async (req, reply) => {
    const { id } = req.params;
    const { max } = req.body || {};
    const PERSONALITY_WORKER_URL = "https://sniffr-personality-worker.joemerrillis.workers.dev";

    req.log.info(`[PersonalityRoute] Called for dog_id: ${id}, max: ${max}`);
    req.log.info(`[PersonalityRoute] Worker URL: ${PERSONALITY_WORKER_URL}`);

    try {
      const fetchBody = { dog_id: id, max };
      req.log.info(`[PersonalityRoute] Fetch body: ${JSON.stringify(fetchBody)}`);

      const res = await fetch(PERSONALITY_WORKER_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fetchBody),
      });

      req.log.info(`[PersonalityRoute] Worker status: ${res.status}`);

      if (!res.ok) {
        const errorText = await res.text();
        req.log.error(`[PersonalityRoute] Worker failed: ${errorText}`);
        return reply.code(500).send({ error: "Personality worker failed", details: errorText });
      }

      const result = await res.json();
      req.log.info(`[PersonalityRoute] Worker result: ${JSON.stringify(result)}`);
      return reply.send(result);

    } catch (err) {
      req.log.error(`[PersonalityRoute] Exception: ${err.stack || err}`);
      return reply.code(500).send({ error: "Internal server error", details: err.message });
    }
  });
}
