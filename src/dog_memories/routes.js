// src/dog_memories/routes.js

import { 
  create, 
  retrieve, 
  listByDog, 
  listByUploader, 
  modify, 
  remove 
} from './controllers/dogMemoriesController.js';

import { dogMemoriesSchemas } from './schemas/dogMemoriesSchemas.js';
import { getSignedUploadUrl } from './services/mediaProcessing.js';
import { uploadToCloudflareImages } from './services/cloudflareImages.js';

export default async function dogMemoriesRoutes(fastify, opts) {
  // Register schemas for Swagger validation (if not already global)
  for (const schema of Object.values(dogMemoriesSchemas)) {
    try { fastify.addSchema(schema); } catch (e) {}
  }

  // CREATE
  fastify.post(
    '/dog-memories',
    {
      schema: {
        tags: ['DogMemories'],
        body: dogMemoriesSchemas.CreateDogMemory,
        response: { 201: dogMemoriesSchemas.DogMemory }
      }
    },
    create
  );

  // GET BY ID
  fastify.get(
    '/dog-memories/:id',
    {
      schema: {
        tags: ['DogMemories'],
        response: { 200: dogMemoriesSchemas.DogMemory }
      }
    },
    retrieve
  );

  // LIST BY DOG
  fastify.get(
    '/dog-memories/dog/:dogId',
    {
      schema: {
        tags: ['DogMemories'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              memories: { type: 'array', items: dogMemoriesSchemas.DogMemory }
            }
          }
        }
      }
    },
    listByDog
  );

  // LIST BY UPLOADER
  fastify.get(
    '/dog-memories/uploader/:userId',
    {
      schema: {
        tags: ['DogMemories'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              memories: { type: 'array', items: dogMemoriesSchemas.DogMemory }
            }
          }
        }
      }
    },
    listByUploader
  );

  // UPDATE
  fastify.patch(
    '/dog-memories/:id',
    {
      schema: {
        tags: ['DogMemories'],
        body: dogMemoriesSchemas.UpdateDogMemory,
        response: { 200: dogMemoriesSchemas.DogMemory }
      }
    },
    modify
  );

  // DELETE
  fastify.delete(
    '/dog-memories/:id',
    {
      schema: {
        tags: ['DogMemories'],
        response: { 200: { 
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            memory: dogMemoriesSchemas.DogMemory
          }
        } }
      }
    },

fastify.post(
  '/dog-memories/upload-url',
  {
    schema: {
      tags: ['DogMemories'],
      body: {
        type: 'object',
        properties: {
          fileType: { type: 'string' },
          fileExt: { type: 'string' }
        },
        required: ['fileType', 'fileExt']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            uploadUrl: { type: 'string' },
            publicUrl: { type: 'string' },
            objectKey: { type: 'string' }
          }
        }
      }
    }
  },
  async (request, reply) => {
    const { fileType, fileExt } = request.body;
    const result = await getSignedUploadUrl({ fileType, fileExt });
    reply.send(result);
  }
);

  fastify.post('/dog-memories/upload', async (request, reply) => {
  const { dog_ids, event_id, ...otherMeta } = request.body;
  const file = request.files?.[0]; // Use fastify-multipart or similar

  if (!file) return reply.code(400).send({ error: 'Image file required' });

  // Metadata to send to Cloudflare
  const metadata = {
    dog_ids,
    event_id,
    ...otherMeta,
  };

  // Upload to Cloudflare
  const cloudflareResp = await uploadToCloudflareImages({
    fileBuffer: file.buffer,
    fileName: file.filename,
    metadata,
  });

  // Save to your DB (pseudo-code)
  const newMemory = await insertDogMemory({
    image_id: cloudflareResp.id,
    dog_ids,
    uploader_id: request.user.id,
    event_id,
    ...otherMeta,
    // add the Cloudflare Images delivery URL
    image_url: `https://imagedelivery.net/9wUa4dldcGfmWFQ1Xyg0gA/<image_id>/<variant_name>`,
  });

  reply.code(201).send({ memory: newMemory });
});
    remove
  );
}
