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
} from '../controller/listDogEventsForDogController.js';
import {
  listDogEventsForDogController,
} from '../controller/listDogEventsForDog.js';
import {
  deleteDogEventController,
} from '../controller/deleteDogEvent.js';
import { dogEventsSchemas } from '../schemas/dogEventsSchemas.js';

export default async function dogEventsRoutes(fastify, opts) {
  // Register response envelopes
  fastify.addSchema(dogEventsSchemas.DogEvent);
  fastify.addSchema(dogEventsSchemas.DogEventsEnvelope);
  fastify.addSchema(dogEventsSchemas.SingleDogEventEnvelope);

  // List all events
  fastify.get('/', {
    schema: {
      tags: ['DogEvents'],
      response: { 200: dogEventsSchemas.DogEventsEnvelope }
    }
  }, listDogEventsController);

  // Create event
  fastify.post('/', {
    schema: {
      tags: ['DogEvents'],
      body: dogEventsSchemas.DogEvent,
      response: { 201: dogEventsSchemas.SingleDogEventEnvelope }
    }
  }, createDogEventController);

  // Get event by id
  fastify.get('/:id', {
    schema: {
      tags: ['DogEvents'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: dogEventsSchemas.SingleDogEventEnvelope }
    }
  }, getDogEventController);

  // Update event by id
  fastify.patch('/:id', {
    schema: {
      tags: ['DogEvents'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: dogEventsSchemas.DogEvent,
      response: { 200: dogEventsSchemas.SingleDogEventEnvelope }
    }
  }, updateDogEventController);

  // Delete event
  fastify.delete('/:id', {
    schema: {
      tags: ['DogEvents'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: { type: 'object', properties: { deleted: { type: 'boolean' } }, required: ['deleted'] } }
    }
  }, deleteDogEventController);

  // List all events for a specific dog
  fastify.get('/dog/:dog_id', {
    schema: {
      tags: ['DogEvents'],
      params: {
        type: 'object',
        properties: { dog_id: { type: 'string', format: 'uuid' } },
        required: ['dog_id']
      },
      response: { 200: dogEventsSchemas.DogEventsEnvelope }
    }
  }, listDogEventsForDogController);
}
