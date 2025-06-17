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

  // TEST UPLOAD PAGE (public, for convenience)
 fastify.get('/dog-memories/test-upload', async (request, reply) => {
  reply.type('text/html').send(`
    <form id="uploadForm" action="/dog-memories/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file"><br>
      <input type="text" name="dog_ids" value="test-dog-id"><br>
      <input type="text" name="event_id" value="test-event-id"><br>
      <button type="submit">Upload</button>
      <button type="button" id="cancelBtn">Cancel Upload</button>
    </form>
    <pre id="result"></pre>
    <script>
    let currentXHR = null;

    document.getElementById('uploadForm').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const data = new FormData(form);
      const resultBox = document.getElementById('result');
      resultBox.textContent = "Uploading...";

      // Use XMLHttpRequest for easy abort/cancel
      currentXHR = new XMLHttpRequest();
      currentXHR.open('POST', '/dog-memories/upload', true);
      currentXHR.onload = function() {
        resultBox.textContent = currentXHR.responseText;
        currentXHR = null;
      };
      currentXHR.onerror = function() {
        resultBox.textContent = "Upload failed.";
        currentXHR = null;
      };
      currentXHR.send(data);
    };

    // Cancel button logic
    document.getElementById('cancelBtn').onclick = function() {
      if (currentXHR) {
        currentXHR.abort();
        document.getElementById('result').textContent = "Upload canceled.";
        currentXHR = null;
      }
      document.getElementById('uploadForm').reset();
    };
    </script>
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

fastify.post(
  '/dog-memories/upload',
  {
    schema: { /* ... */ },
    preHandler: []
  },
  async (request, reply) => {
    // START logging here:
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
    fastify.log.info('All parts processed, file and fields extracted');

    if (!file) {
      fastify.log.warn('No file uploaded!');
      return reply.code(400).send({ error: 'Image file required' });
    }

    fastify.log.info('About to read file stream...');
    const fileBuffer = await streamToBuffer(file.file);
    fastify.log.info('File buffer created, length: ' + fileBuffer.length);

    fastify.log.info('About to upload to Cloudflare...');
    const cloudflareResp = await uploadToCloudflareImages({
      fileBuffer,
      fileName: file.filename,
      metadata: { dog_ids: fields.dog_ids, event_id: fields.event_id } // example metadata
    });
    fastify.log.info({ cloudflareResp }, 'Cloudflare upload finished');

    fastify.log.info('About to insert into DB...');
    const newMemory = await insertDogMemory({
      image_id: cloudflareResp.id,
      dog_ids: fields.dog_ids,
      uploader_id: request.user?.id || null,
      event_id: fields.event_id,
      image_url: `https://imagedelivery.net/9wUa4dldcGfmWFQ1Xyg0gA/${cloudflareResp.id}/public`,
    });
    fastify.log.info({ newMemory }, 'DB insert finished');

    reply.code(201).send({ memory: newMemory });
    fastify.log.info('Upload route completed');
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
