import { 
  create, 
  retrieve, 
  listByDog, 
  listByUploader, 
  modify, 
  remove,
  enrichBatch,       // ADD THIS
  saveAndParseMemory // ADD THIS
} from './controllers/dogMemoriesController.js';

import { dogMemoriesSchemas } from './schemas/dogMemoriesSchemas.js';
import { handleDogMemoryUpload } from './services/uploadHandler.js';

export default async function dogMemoriesRoutes(fastify, opts) {
  // Register schemas for Swagger validation (if not already global)
  for (const schema of Object.values(dogMemoriesSchemas)) {
    try { fastify.addSchema(schema); } catch (e) {}
  }

  // New: Async batch enrichment (AI caption/tag) for selected dog_memories
  fastify.post(
    '/dog-memories/enrich-batch',
    {
      schema: {
        tags: ['DogMemories'],
        body: {
          type: 'object',
          required: ['memoryIds'],
          properties: {
            memoryIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              minItems: 1
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              memories: {
                type: 'array',
                items: dogMemoriesSchemas.DogMemory
              }
            }
          }
        }
      }
    },
    enrichBatch
  );

  // New: PATCH endpoint to save caption/tags, then parse events (fires on user save)
  fastify.patch(
    '/dog-memories/:id/save-parse',
    {
      schema: {
        tags: ['DogMemories'],
        body: {
          type: 'object',
          required: ['caption', 'tags'],
          properties: {
            caption: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              memory: dogMemoriesSchemas.DogMemory,
              parsedEvents: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      }
    },
    saveAndParseMemory
  );
  
  // TEST UPLOAD PAGE (public, for convenience)
  fastify.get('/dog-memories/test-upload', async (request, reply) => {
    reply.type('text/html').send(`
      <form id="uploadForm" action="/dog-memories/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" required><br>
        <input type="text" name="dog_ids" value="318aa1f8-f2ab-4f2b-92de-044a22b6c8ae" required><br>
        <input type="text" name="event_id" value="98a40eb1-4f9c-4758-b0fa-778a7d92d377" required><br>
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

  // CRUD routes
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

  // SIGNED UPLOAD URL (optional R2 support, may want to refactor out later)
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
      // You must implement getSignedUploadUrl in your services for this to work!
      const result = await getSignedUploadUrl({ fileType, fileExt });
      fastify.log.info({ result }, 'Signed upload URL generated');
      reply.send(result);
    }
  );

  // File upload (uses separate handler for sanity)
  fastify.post(
    '/dog-memories/upload',
    {
      schema: { /* ... */ },
      preHandler: []
    },
    async (request, reply) => {
      // Notice we pass fastify for logger
      await handleDogMemoryUpload(request, reply, fastify);
    }
  );
}
