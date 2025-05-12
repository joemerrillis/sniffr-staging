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
      response: { 200: { type: 'array', items: Walk } }
    }
  }, listWalks);

  // Get a single walk by ID
  fastify.get('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      response: { 200: Walk }
    }
  }, getWalk);

  // Day-view: draft walks for a date, with optional fallback to last week's confirmed
  fastify.get('/day', {
    schema: {
      querystring: DayQuery,
      response: { 200: { type: 'array', items: Walk } }
    }
  }, listWalksByDay);

  // Create a new draft walk
  fastify.post('/', {
    schema: {
      body: CreateWalk,
      response: { 201: Walk }
    }
  }, createWalk);

  // Update an existing walk (schedule time, reassign walker, confirm)
  fastify.patch('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      body: UpdateWalk,
      response: { 200: Walk }
    }
  }, updateWalk);

  // Delete a draft walk
  fastify.delete('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] }
    }
  }, deleteWalk);

  // Bulk-confirm all drafts on a given date
  fastify.post('/day/confirm', {
    schema: {
      body: ConfirmDayBody,
      response: { 200: { type: 'object', properties: { confirmed: { type: 'integer' } } } }
    }
  }, confirmDay);

  // Clone last week's confirmed to new-week drafts
  fastify.post('/clone-week', {
    schema: {
      body: CloneWeekBody,
      response: { 201: { type: 'array', items: Walk } }
    }
  }, cloneWeek);
}
