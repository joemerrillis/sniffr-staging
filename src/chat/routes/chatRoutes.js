import { listChats, createChatHandler, retrieveChat } from '../controllers/chatController.js';

export default async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/chats',
    handler: listChats,
    schema: {
      tags: ['Chat'],
      description: 'List all chats for the current user.',
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: 'Chat#' }
            }
          },
          required: ['data']
        }
      }
    }
  });

  fastify.route({
    method: 'POST',
    url: '/chats',
    handler: createChatHandler,
    schema: {
      tags: ['Chat'],
      description: 'Create a new chat.',
      body: { $ref: 'CreateChat#' },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { $ref: 'Chat#' }
          },
          required: ['data']
        }
      }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/chats/:id',
    handler: retrieveChat,
    schema: {
      tags: ['Chat'],
      description: 'Get a single chat and its participants/messages.',
      params: { id: { type: 'string', format: 'uuid' } },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'Chat#' }
          },
          required: ['data']
        }
      }
    }
  });
}
