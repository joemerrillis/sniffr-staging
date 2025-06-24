import { addReactionHandler, removeReactionHandler } from '../controllers/reactionController.js';

export default async function (fastify, opts) {
  fastify.route({
    method: 'POST',
    url: '/messages/:id/reactions',
    handler: addReactionHandler,
    schema: {
      tags: ['Chat'],
      description: 'Add a reaction to a message.',
      params: { id: { type: 'string', format: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          emoji: { type: 'string' }
        },
        required: ['user_id', 'emoji']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'ChatMessage#' }
          },
          required: ['data']
        }
      }
    }
  });

  fastify.route({
    method: 'DELETE',
    url: '/messages/:id/reactions',
    handler: removeReactionHandler,
    schema: {
      tags: ['Chat'],
      description: 'Remove a reaction from a message.',
      params: { id: { type: 'string', format: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          emoji: { type: 'string' }
        },
        required: ['user_id', 'emoji']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'ChatMessage#' }
          },
          required: ['data']
        }
      }
    }
  });
}
