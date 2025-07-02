import {
  WalksScheduleEnvelope,
  WalkSchedule
} from './schemas/schedulingSchemas.js';

import {
  listWalks,
  confirmWalksForDay,
  updateWalk,
  approveWalk
} from './controllers/schedulingController.js';

export default async function schedulingRoutes(fastify, opts) {
  // 1. List all walks for a tenant for a week
  fastify.get(
    '/walks',
    {
      schema: {
        description: 'List all walks for a tenant for a given week.',
        tags: ['Scheduling'],
        querystring: {
          type: 'object',
          properties: {
            tenant_id:   { type: 'string', format: 'uuid' },
            week_start:  { type: 'string', format: 'date' }
          },
          required: ['tenant_id', 'week_start']
        },
        response: {
          200: WalksScheduleEnvelope
        }
      }
    },
    listWalks
  );

  // 2. Confirm all draft walks for a specific day (batch)
  fastify.patch(
    '/walks/confirm-day',
    {
      schema: {
        description: 'Confirm all draft walks for a tenant on a specific day.',
        tags: ['Scheduling'],
        body: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
            date:      { type: 'string', format: 'date' }
          },
          required: ['tenant_id', 'date']
        },
        response: {
          200: WalksScheduleEnvelope
        }
      }
    },
    confirmWalksForDay
  );

  // 3. Update a single walk (time, walker, etc.)
  fastify.patch(
    '/walks/:walk_id',
    {
      schema: {
        description: 'Update a single walk (time, walker, etc).',
        tags: ['Scheduling'],
        params: {
          type: 'object',
          properties: { walk_id: { type: 'string', format: 'uuid' } },
          required: ['walk_id']
        },
        body: WalkSchedule,
        response: {
          200: {
            type: 'object',
            properties: { walk: WalkSchedule },
            required: ['walk']
          }
        }
      }
    },
    updateWalk
  );

  // 4. Client approves a walk change
  fastify.patch(
    '/walks/:walk_id/approve',
    {
      schema: {
        description: 'Client approves a time/walker change for a walk.',
        tags: ['Scheduling'],
        params: {
          type: 'object',
          properties: { walk_id: { type: 'string', format: 'uuid' } },
          required: ['walk_id']
        },
        response: {
          200: {
            type: 'object',
            properties: { walk: WalkSchedule },
            required: ['walk']
          }
        }
      }
    },
    approveWalk
  );
}
