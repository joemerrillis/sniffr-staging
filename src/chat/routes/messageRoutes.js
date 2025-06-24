import {
  listMessagesHandler,
  sendMessageHandler,
  editMessageHandler,
  deleteMessageHandler
} from '../controllers/messageController.js';

export default async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/chats/:id/messages',
    handler: listMessagesHandler,
    schema: {
      tags: ['Chat'],
      description: 'List messages for a chat (paginated).',
      params: { id: { type: 'string', format: 'uuid' } },
      querystring: {
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        before: { type: ['string', 'null'], format: 'date-time' }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: 'ChatMessage#' }
            }
          },
          required: ['data']
        }
      }
    }
  });

  fastify.route({
    method: 'POST',
    url: '/chats/:id/messages',
    handler: sendMessageHandler,
    schema: {
      tags: ['Chat'],
      description: 'Send a message in a chat.',
      params: { id: { type: 'string', format: 'uuid' } },
      body: { $ref: 'CreateChatMessage#' },
      response: {
        201: {
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
    method: 'PATCH',
    url: '/messages/:id',
    handler: editMessageHandler,
    schema: {
      tags: ['Chat'],
      description: 'Edit a message (v2, optional).',
      params: { id: { type: 'string', format: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          new_body: { type: 'string' }
        },
        required: ['new_body']
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
    url: '/messages/:id',
    handler: deleteMessageHandler,
    schema: {
      tags: ['Chat'],
      description: 'Delete a message (soft delete).',
      params: { id: { type: 'string', format: 'uuid' } },
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
