import { 
  createDogEventController,
} from '../controller/createDogEvent.js';
import {
  updateDogEventController,
} from '../controller/updateDogEvent.js';
import {
  getDogEventController,
} from '../controller/getDogEvent.js';
import {
  listDogEventsController,
} from '../controller/listDogEvents.js';
import {
  deleteDogEventController,
} from '../controller/deleteDogEvent.js';
import {
  bulkCreateDogEventsController,
} from '../controller/bulkCreateDogEvents.js';
import {
  listDogEventsForDogController,
} from '../controller/listDogEventsForDog.js';
import { dogEventsSchemas } from '../schemas/dogEventsSchemas.js';

export default async function dogEventsRoutes(fastify, opts) {
  fastify.post(
    '/',
    {
      schema: {
        body: dogEventsSchemas.CreateDogEvent,
        response: { 201: dogEventsSchemas.SingleDogEventEnvelope },
        tags: ['DogEvents'],
        summary: 'Create a new dog event'
      }
    },
    createDogEventController
  );

  fastify.post(
    '/bulk',
    {
      schema: {
        body: dogEventsSchemas.BulkCreateDogEvents,
        response: { 201: dogEventsSchemas.BulkCreateDogEventsResponse },
        tags: ['DogEvents'],
        summary: 'Bulk create dog events'
      }
    },
    bulkCreateDogEventsController
  );

  fastify.get(
    '/',
    {
      schema: {
        querystring: dogEventsSchemas.ListDogEventsQuery,
        response: {
          200: dogEventsSchemas.DogEventsEnvelope
        },
        tags: ['DogEvents'],
        summary: 'List all dog events'
      }
    },
    listDogEventsController
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: dogEventsSchemas.SingleDogEventEnvelope
        },
        tags: ['DogEvents'],
        summary: 'Retrieve a single dog event'
      }
    },
    getDogEventController
  );

  fastify.get(
    '/dog/:dog_id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { dog_id: { type: 'string', format: 'uuid' } },
          required: ['dog_id']
        },
        response: {
          200: dogEventsSchemas.DogEventsEnvelope
        },
        tags: ['DogEvents'],
        summary: 'List all events for a specific dog'
      }
    },
    listDogEventsForDogController
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: dogEventsSchemas.UpdateDogEvent,
        response: {
          200: dogEventsSchemas.SingleDogEventEnvelope
        },
        tags: ['DogEvents'],
        summary: 'Update a dog event'
      }
    },
    updateDogEventController
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 200: { type: 'object', properties: { deleted: { type: 'boolean' } } } },
        tags: ['DogEvents'],
        summary: 'Delete a dog event'
      }
    },
    deleteDogEventController
  );
}
