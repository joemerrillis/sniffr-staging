// src/walks/routes.js

import {
  listWalks,
  getWalk,
  listWalksByDay,
  createWalk,
  updateWalk,
  deleteWalk,
  confirmDay,
  cloneWeek
} from './controllers/walksController.js';

import {
  Walk,
  CreateWalk,
  UpdateWalk,
  DayQuery,
  ConfirmDayBody,
  CloneWeekBody
} from './schemas/walksSchemas.js';

export default async function routes(fastify, opts) {
  // List all walks
  fastify.get('/', {
    schema: {
      description: 'List all walks for the tenant.',
      tags: ['Walks'],
      response: { 200: { type: 'array', items: Walk } }
    }
  }, listWalks);

  // Get a single walk by ID
  fastify.get('/:id', {
    schema: {
      description: 'Retrieve a single walk by its ID.',
      tags: ['Walks'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: Walk }
    }
  }, getWalk);

  // Day-view: draft walks for a date, with optional fallback to last week's confirmed
  fastify.get('/day', {
    schema: {
      description: 'List draft walks for a given date, with optional fallback to last week\'s confirmed walks.',
      tags: ['Walks'],
      querystring: DayQuery,
      response: { 200: { type: 'array', items: Walk } }
    }
  }, listWalksByDay);

  // Create a new draft walk
  fastify.post('/', {
    schema: {
      description: 'Create a new draft walk.',
      tags: ['Walks'],
      body: CreateWalk,
      response: { 201: Walk }
    }
  }, createWalk);

  // Update an existing walk (schedule time, reassign walker, confirm)
  fastify.patch('/:id', {
    schema: {
      description: 'Update an existing walk (schedule, walker, confirmation, etc).',
      tags: ['Walks'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateWalk,
      response: { 200: Walk }
    }
  }, updateWalk);

  // Delete a draft walk
  fastify.delete('/:id', {
    schema: {
      description: 'Delete a walk by its ID.',
      tags: ['Walks'],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: {
        204: {} // No content, no schema required
      }
    }
  }, deleteWalk);

  // Bulk-confirm all drafts on a given date
  fastify.post('/day/confirm', {
    schema: {
      description: 'Bulk-confirm all draft walks on a given date.',
      tags: ['Walks'],
      body: ConfirmDayBody,
      response: {
        200: {
          type: 'object',
          properties: { confirmed: { type: 'integer' } },
          required: ['confirmed']
        }
      }
    }
  }, confirmDay);

  // Clone last week's confirmed to new-week drafts
  fastify.post('/clone-week', {
    schema: {
      description: 'Clone last week\'s confirmed walks to the new week as drafts.',
      tags: ['Walks'],
      body: CloneWeekBody,
      response: {
        201: { type: 'array', items: Walk }
      }
    }
  }, cloneWeek);
}
