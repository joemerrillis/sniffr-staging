import { markReadHandler } from '../controllers/readController.js';

export default async function (fastify, opts) {
  fastify.route({
    method: 'POST',
    url: '/messages/:id/read',
    handler: markReadHandler,
    schema: {
      tags: ['Chat'],
      description: 'Mark a message as read by the current user.',
      params: { id: { type: 'string', format: 'uuid' } },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { $ref: 'ChatMessageRead#' }
          },
          required: ['data']
        }
      }
    }
  });
}
