import {
  listMembersHandler,
  addMemberHandler,
  removeMemberHandler
} from '../controllers/householdMemberController.js';

export default async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/households/:id/members',
    handler: listMembersHandler,
    schema: {
      tags: ['Households'],
      description: 'List members of a household.',
      params: { id: { type: 'string', format: 'uuid' } }
    }
  });

  fastify.route({
    method: 'POST',
    url: '/households/:id/members',
    handler: addMemberHandler,
    schema: {
      tags: ['Households'],
      description: 'Add a member to a household.',
      params: { id: { type: 'string', format: 'uuid' } },
      body: { $ref: 'AddHouseholdMember#' }
    }
  });

  fastify.route({
    method: 'DELETE',
    url: '/households/:id/members/:user_id',
    handler: removeMemberHandler,
    schema: {
      tags: ['Households'],
      description: 'Remove a member from a household.',
      params: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' }
      }
    }
  });
}
