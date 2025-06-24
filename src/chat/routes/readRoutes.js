// src/chat/routes/readRoutes.js

import { markReadHandler } from '../controllers/readController.js';

export default async function (fastify, opts) {
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
