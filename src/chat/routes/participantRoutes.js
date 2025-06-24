import { addParticipantHandler, removeParticipantHandler } from '../controllers/participantController.js';

export default async function (fastify, opts) {
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
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { $ref: 'ChatParticipant#' }
          },
          required: ['data']
        }
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
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
              },
              required: ['success']
            }
          },
          required: ['data']
        }
      }
    }
  });
}
