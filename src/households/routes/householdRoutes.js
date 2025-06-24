import {
  createHouseholdHandler,
  getHouseholdHandler,
  listHouseholdsForTenantHandler,
  listHouseholdsForUserHandler,
  updateHouseholdHandler
} from '../controllers/householdController.js';

export default async function (fastify, opts) {
  fastify.route({
    method: 'GET',
    url: '/households',
    handler: listHouseholdsForTenantHandler,
    schema: {
      tags: ['Households'],
      description: 'List all households for tenant.',
      response: { 200: { type: 'object' } }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/households/my',
    handler: listHouseholdsForUserHandler,
    schema: {
      tags: ['Households'],
      description: 'List households for the current user.',
      response: { 200: { type: 'object' } }
    }
  });

  fastify.route({
    method: 'POST',
    url: '/households',
    handler: createHouseholdHandler,
    schema: {
      tags: ['Households'],
      description: 'Create a new household.',
      body: { $ref: 'CreateHousehold#' },
      response: { 201: { $ref: 'Household#' } }
    }
  });

  fastify.route({
    method: 'GET',
    url: '/households/:id',
    handler: getHouseholdHandler,
    schema: {
      tags: ['Households'],
      description: 'Get details for a household.',
      params: { id: { type: 'string', format: 'uuid' } }
    }
  });

  fastify.route({
    method: 'PATCH',
    url: '/households/:id',
    handler: updateHouseholdHandler,
    schema: {
      tags: ['Households'],
      description: 'Update household.',
      params: { id: { type: 'string', format: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          display_name: { type: ['string', 'null'] },
          primary_contact_id: { type: ['string', 'null'], format: 'uuid' },
          notes: { type: ['string', 'null'] }
        }
      }
    }
  });
}
