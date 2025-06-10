import {
  ClientWalkWindow,
  CreateClientWalkWindow,
  UpdateClientWalkWindow,
  WindowsEnvelope,
  WindowEnvelope,
  PricePreview
} from './schemas/clientWalkWindowsSchemas.js';

import {
  listWindows,
  getWindow,
  createWindow,
  updateWindow,
  deleteWindow,
  listClientWindowsForTenant,
  seedWalksForCurrentWeek
} from './controllers/index.js'; // <-- changed!

export default async function routes(fastify, opts) {
  // 1) LIST ALL CLIENT WALK WINDOWS (client only)
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all client walk windows for the authenticated user. Optionally filter by week_start.',
        tags: ['ClientWalkWindows'],
        querystring: {
          type: 'object',
          properties: {
            week_start: { type: 'string', format: 'date' }
          }
        },
        response: {
          200: WindowsEnvelope
        }
      }
    },
    listWindows
  );

  // 2) TENANT: List all walk windows for a specific client (with optional week_start)
  fastify.get(
    '/tenants/:tenant_id/clients/:client_id/walk-windows',
    {
      schema: {
        description: 'Tenant endpoint: List all walk windows for a given client, optionally filtered by week_start.',
        tags: ['TenantClientWalkWindows'],
        params: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
            client_id: { type: 'string', format: 'uuid' }
          },
          required: ['tenant_id', 'client_id']
        },
        querystring: {
          type: 'object',
          properties: {
            week_start: { type: 'string', format: 'date' }
          }
        },
        response: {
          200: WindowsEnvelope
        }
      }
    },
    listClientWindowsForTenant
  );

  // 3) GET A SINGLE CLIENT WALK WINDOW BY ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get a client walk window by ID.',
        tags: ['ClientWalkWindows'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              window: ClientWalkWindow,
              price_preview: PricePreview // Explicit in top-level response
            }
          }
        }
      }
    },
    getWindow
  );

  // 4) CREATE A NEW CLIENT WALK WINDOW
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new client walk window.',
        tags: ['ClientWalkWindows'],
        body: CreateClientWalkWindow,
        response: {
          201: {
            type: 'object',
            properties: {
              walk_window: ClientWalkWindow,
              service_dogs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    service_type: { type: 'string' },
                    service_id: { type: 'string', format: 'uuid' },
                    dog_id: { type: 'string', format: 'uuid' }
                  }
                }
              },
              price_preview: PricePreview // Explicit in top-level response
            }
          }
        }
      }
    },
    createWindow
  );

  // 5) UPDATE AN EXISTING CLIENT WALK WINDOW
  fastify.patch(
    '/:id',
    {
      schema: {
        description: 'Update a client walk window.',
        tags: ['ClientWalkWindows'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: UpdateClientWalkWindow,
        response: {
          200: {
            type: 'object',
            properties: {
              walk_window: ClientWalkWindow,
              service_dogs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    service_type: { type: 'string' },
                    service_id: { type: 'string', format: 'uuid' },
                    dog_id: { type: 'string', format: 'uuid' }
                  }
                }
              },
              price_preview: PricePreview // Explicit in top-level response
            }
          }
        }
      }
    },
    updateWindow
  );

  // 6) DELETE A CLIENT WALK WINDOW
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete a client walk window.',
        tags: ['ClientWalkWindows'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 204: {} }
      }
    },
    deleteWindow
  );

  // 7) SEED PENDING WALKS FOR CURRENT WEEK (FIXED: add tags here!)
  fastify.post(
    '/seed-now',
    {
      schema: {
        description: 'Seed pending walks for the remainder of this week based on current walk windows.',
        tags: ['ClientWalkWindows'],
        body: {
          type: 'object',
          properties: {
            user_id: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              seeded: { type: 'integer' }
            }
          }
        }
      },
      preHandler: [fastify.authenticate]
    },
    seedWalksForCurrentWeek
  );
}
