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
  fastify.get('/', { schema: { response: { 200: { type: 'array', items: Walk } } } }, listWalks);
  fastify.get('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      response: { 200: Walk }
    }
  }, getWalk);
  fastify.get('/day', {
    schema: {
      querystring: DayQuery,
      response: { 200: { type: 'array', items: Walk } }
    }
  }, listWalksByDay);
  fastify.post('/', {
    schema: { body: CreateWalk, response: { 201: Walk } }
  }, createWalk);
  fastify.patch('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      body: UpdateWalk,
      response: { 200: Walk }
    }
  }, updateWalk);
  fastify.delete('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] }
    }
  }, deleteWalk);
  fastify.post('/day/confirm', {
    schema: {
      body: ConfirmDayBody,
      response: { 200: { type: 'object', properties: { confirmed: { type: 'integer' } } } }
    }
  }, confirmDay);
  fastify.post('/clone-week', {
    schema: {
      body: CloneWeekBody,
      response: { 201: { type: 'array', items: Walk } }
    }
  }, cloneWeek);
}
