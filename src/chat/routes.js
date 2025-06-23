// src/chat/routes.js

import {
  listChats,
  createChatHandler,
  retrieveChat,
  addParticipantHandler,
  removeParticipantHandler,
  listMessagesHandler,
  sendMessageHandler,
  editMessageHandler,
  deleteMessageHandler,
  addReactionHandler,
  removeReactionHandler,
  markReadHandler
} from './controllers/chatController.js';

export default async function (fastify, opts) {
  // All endpoints tagged 'Chat' for Swagger grouping

  fastify.route({
    method: 'GET',
    url: '/chats',
    handler: listChats,
    schema: {
      tags: ['Chat'],
      description: 'List all chats for the current user.',
      response: { 200: { type: 'object' } }
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
      response: { 201: { $ref: 'Chat#' } }
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
      response: { 200: { $ref: 'Chat#' } }
    }
  });

  // Participants
  fastify.route({
    method: 'POST',
    url: '/chats/:id/participants',
    handler: addParticipantHandler,
    schema: {
      tags: ['Chat'],
      description: 'Add a participant to a chat.',
      params: { id: { type: 'string', format: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          user_id: { type: 'string', format: 'uuid' },
          role: { type: ['string', 'null'] }
        },
        required: ['user_id']
      }
    }
  });

  fastify.route({
    method: 'DELETE',
    url: '/chats/:id/participants/:user_id',
    handler: removeParticipantHandler,
    schema: {
      tags: ['Chat'],
      description: 'Remove a participant from a chat.',
      params: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' }
      }
    }
  });

  // Chat messages
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
      response: { 201: { $ref: 'ChatMessage#' } }
    }
  });

  // Single message ops
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
      params: { id: { type: 'string', format: 'uuid' } }
    }
  });

  // Reactions
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
      }
    }
  });

  // Read receipts
  fastify.route({
    method: 'POST',
    url: '/messages/:id/read',
    handler: markReadHandler,
    schema: {
      tags: ['Chat'],
      description: 'Mark a message as read by the current user.',
      params: { id: { type: 'string', format: 'uuid' } }
    }
  });
}
