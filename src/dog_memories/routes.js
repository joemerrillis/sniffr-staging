import { 
  create, 
  retrieve, 
  listByDog, 
  listByUploader, 
  modify, 
  remove 
} from './controllers/dogMemoriesController.js';

import { dogMemoriesSchemas } from './schemas/dogMemoriesSchemas.js';  // <-- THIS LINE

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
    remove
  );

  // SIGNED UPLOAD URL (optional R2 support)
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

  // DIRECT UPLOAD TO CLOUDFLARE IMAGES
 fastify.post(
  '/dog-memories/upload',
  {
    schema: {
      tags: ['DogMemories'],
      summary: 'Directly upload a photo and create a memory',
      description: 'Uploads an image file to Cloudflare Images and creates a new dog memory record.',
      // Optionally, define request body and response schemas here!
    }
  },
  async (request, reply) => {
    const parts = request.parts();
    let file, fields = {};

    for await (const part of parts) {
      if (part.file) {
        file = part;
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    if (!file) return reply.code(400).send({ error: 'Image file required' });

    // Handle dog_ids as an array or string
    const dog_ids = fields.dog_ids
      ? Array.isArray(fields.dog_ids)
        ? fields.dog_ids
        : [fields.dog_ids]
      : [];

    // Optionally parse event_id and any other metadata
    const event_id = fields.event_id || null;
    const otherMeta = { ...fields };
    delete otherMeta.dog_ids;
    delete otherMeta.event_id;

    // Read file stream into buffer
    const fileBuffer = await streamToBuffer(file.file);

    // Metadata to send to Cloudflare
    const metadata = {
      dog_ids,
      event_id,
      ...otherMeta,
    };

    // Upload to Cloudflare
    const cloudflareResp = await uploadToCloudflareImages({
      fileBuffer,
      fileName: file.filename,
      metadata,
    });

    // Save to your DB (pseudo-code)
    const newMemory = await insertDogMemory({
      image_id: cloudflareResp.id,
      dog_ids,
      uploader_id: request.user?.id || null,
      event_id,
      ...otherMeta,
      image_url: `https://imagedelivery.net/9wUa4dldcGfmWFQ1Xyg0gA/${cloudflareResp.id}/public`,
    });

    reply.code(201).send({ memory: newMemory });
  }
);

// Helper function to read a stream to a buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
