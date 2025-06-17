import { 
  create, 
  retrieve, 
  listByDog, 
  listByUploader, 
  modify, 
  remove 
} from './controllers/dogMemoriesController.js';

import { dogMemoriesSchemas } from './schemas/dogMemoriesSchemas.js';

import { uploadToCloudflareImages } from './services/cloudflareImages.js';

export default async function dogMemoriesRoutes(fastify, opts) {
  // Register schemas for Swagger validation (if not already global)
  for (const schema of Object.values(dogMemoriesSchemas)) {
    try { fastify.addSchema(schema); } catch (e) {}
  }

  // TEST UPLOAD PAGE (move this up top, but anywhere inside is fine)
  fastify.get('/dog-memories/test-upload', async (request, reply) => {
    reply.type('text/html').send(`
      <form action="/dog-memories/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file"><br>
        <input type="text" name="dog_ids" value="test-dog-id"><br>
        <input type="text" name="event_id" value="test-event-id"><br>
        <button type="submit">Upload</button>
      </form>
    `);
  });

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
      fastify.log.info('upload-url route called');
      const { fileType, fileExt } = request.body;
      fastify.log.info({ fileType, fileExt }, 'Received fileType and fileExt');
      const result = await getSignedUploadUrl({ fileType, fileExt });
      fastify.log.info({ result }, 'Signed upload URL generated');
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
      }
    },
    async (request, reply) => {
      fastify.log.info('Starting upload handler');

      const parts = request.parts();
      let file, fields = {};

      for await (const part of parts) {
        if (part.file) {
          fastify.log.info({ filename: part.filename, mimetype: part.mimetype }, 'File part received');
          file = part;
        } else {
          fastify.log.info({ field: part.fieldname, value: part.value }, 'Field part received');
          fields[part.fieldname] = part.value;
        }
      }

      if (!file) {
        fastify.log.warn('No file uploaded!');
        return reply.code(400).send({ error: 'Image file required' });
      }

      fastify.log.info({ fields }, 'Parsed fields from upload');

      // Handle dog_ids as an array or string
      const dog_ids = fields.dog_ids
        ? Array.isArray(fields.dog_ids)
          ? fields.dog_ids
          : [fields.dog_ids]
        : [];

      fastify.log.info({ dog_ids }, 'Parsed dog_ids');

      // Optionally parse event_id and any other metadata
      const event_id = fields.event_id || null;
      fastify.log.info({ event_id }, 'Parsed event_id');

      const otherMeta = { ...fields };
      delete otherMeta.dog_ids;
      delete otherMeta.event_id;

      // Read file stream into buffer
      fastify.log.info('Reading file stream into buffer...');
      const fileBuffer = await streamToBuffer(file.file);
      fastify.log.info({ fileBufferLength: fileBuffer.length }, 'File buffer created');

      // Metadata to send to Cloudflare
      const metadata = {
        dog_ids,
        event_id,
        ...otherMeta,
      };
      fastify.log.info({ metadata }, 'Prepared metadata for Cloudflare');

      // Upload to Cloudflare
      let cloudflareResp;
      try {
        fastify.log.info('Uploading to Cloudflare Images...');
        cloudflareResp = await uploadToCloudflareImages({
          fileBuffer,
          fileName: file.filename,
          metadata,
        });
        fastify.log.info({ cloudflareResp }, 'Received response from Cloudflare');
      } catch (err) {
        fastify.log.error({ err }, 'Cloudflare upload failed');
        return reply.code(500).send({ error: 'Cloudflare upload failed', details: err.message });
      }

      // Save to your DB (pseudo-code)
      let newMemory;
      try {
        fastify.log.info('Inserting memory into DB...');
        newMemory = await insertDogMemory({
          image_id: cloudflareResp.id,
          dog_ids,
          uploader_id: request.user?.id || null,
          event_id,
          ...otherMeta,
          image_url: `https://imagedelivery.net/9wUa4dldcGfmWFQ1Xyg0gA/${cloudflareResp.id}/public`,
        });
        fastify.log.info({ newMemory }, 'Inserted memory into DB');
      } catch (err) {
        fastify.log.error({ err }, 'DB insert failed');
        return reply.code(500).send({ error: 'DB insert failed', details: err.message });
      }

      reply.code(201).send({ memory: newMemory });
      fastify.log.info('Upload route completed successfully');
    }
  );

  // Helper function to read a stream to a buffer
  async function streamToBuffer(stream) {
    fastify.log.info('Starting streamToBuffer...');
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    fastify.log.info({ bufferLength: buffer.length }, 'streamToBuffer complete');
    return buffer;
  }
}
