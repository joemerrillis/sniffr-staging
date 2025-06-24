// src/chat/routes/participantRoutes.js

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
}
