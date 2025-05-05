import { friendSchemas } from './schemas.js';
import { list, retrieve, create, modify, remove } from './controllers.js';

export default async function routes(fastify, opts) {
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: { dog_id: { type: 'string', format: 'uuid' } }
      },
      response: {
        200: {
          type: 'object',
          properties: { friendships: { type: 'array', items: friendSchemas.Friend } },
          required: ['friendships']
        }
      }
    }
  }, list);

  fastify.get('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      response: { 200: friendSchemas.Friend }
    }
  }, retrieve);

  fastify.post('/', {
    schema: { body: friendSchemas.CreateFriend, response: { 201: friendSchemas.Friend } }
  }, create);

  fastify.patch('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] },
      body: friendSchemas.UpdateFriend,
      response: { 200: friendSchemas.Friend }
    }
  }, modify);

  fastify.delete('/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } }, required: ['id'] }
    }
  }, remove);
};
