import { assignmentSchemas } from './schemas/dogAssignmentsSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove
} from './controllers/dogAssignmentsController.js';

export default async function routes(fastify, opts) {
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dog_id: { type: 'string', format: 'uuid' },
          walker_id: { type: 'string', format: 'uuid' },
          source: { type: 'string', enum: ['tenant','owner'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            assignments: { type: 'array', items: assignmentSchemas.Assignment }
          },
          required: ['assignments']
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
      response: { 200: assignmentSchemas.Assignment }
    }
  }, retrieve);

  fastify.post('/', {
    schema: {
      body: assignmentSchemas.CreateAssignment,
      response: { 201: assignmentSchemas.Assignment }
    }
  }, create);

  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: assignmentSchemas.UpdateAssignment,
      response: { 200: assignmentSchemas.Assignment }
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
};
