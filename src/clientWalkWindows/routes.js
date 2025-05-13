// src/clientWalkWindows/routes.js

import {
  listWindows,
  getWindow,
  createWindow,
  updateWindow,
  deleteWindow,
  listWindowsForWeek
} from './controllers/clientWalkWindowsController.js';

import {
  Window,
  CreateWindow,
  UpdateWindow,
  WeekQuery
} from './schemas/clientWalkWindowsSchemas.js';

export default async function routes(fastify, opts) {
  // 1) List all windows for current user
  fastify.get('/', {
    schema: {
      response: { 200: { type: 'array', items: Window } }
    }
  }, listWindows);

  // 2) Retrieve a single window by ID
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      response: { 200: Window }
    }
  }, getWindow);

  // 3) List windows active during a given week
  fastify.get('/week', {
    schema: {
      querystring: WeekQuery,
      response: { 200: { type: 'array', items: Window } }
    }
  }, listWindowsForWeek);

  // 4) Create a new window
  fastify.post('/', {
    schema: {
      body: CreateWindow,
      response: { 201: Window }
    }
  }, createWindow);

  // 5) Update an existing window
  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: UpdateWindow,
      response: { 200: Window }
    }
  }, updateWindow);

  // 6) Delete a window
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      }
    }
  }, deleteWindow);
}
