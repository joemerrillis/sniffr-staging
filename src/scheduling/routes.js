import {
  listWalks,
  confirmWalksForDay,
  updateWalk,
  approveWalk
} from './controllers/schedulingController.js';
import {
  WalksScheduleEnvelope,
  WalkSchedule
} from './schemas/schedulingSchemas.js';

export default async function schedulingRoutes(fastify, opts) {
  // List all walks for tenant in a week
  fastify.get(
    '/walks',
    {
      schema: {
        description: 'List all walks for a tenant in a given week (draft, scheduled, approved, pending approval)',
        tags: ['Scheduling'],
        querystring: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
            week_start: { type: 'string', format: 'date' }
          },
          required: ['tenant_id', 'week_start']
        },
        response: { 200: { $ref: 'WalksScheduleEnvelope#' } }
      }
    },
    listWalks
  );

  // Batch confirm all walks for a day
  fastify.patch(
    '/walks/confirm-day',
    {
      schema: {
        description: 'Confirm all draft walks for a day',
        tags: ['Scheduling'],
        body: {
          type: 'object',
          properties: {
            tenant_id: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' }
          },
          required: ['tenant_id','date']
        },
        response: { 200: { $ref: 'WalksScheduleEnvelope#' } }
      }
    },
    confirmWalksForDay
  );

  // Update a walk (may require approval)
  fastify.patch(
    '/walks/:walk_id',
    {
      schema: {
        description: 'Update a walk (time, walker, etc), triggers client approval if needed',
        tags: ['Scheduling'],
        params: {
          type: 'object',
          properties: { walk_id: { type: 'string', format: 'uuid' } },
          required: ['walk_id']
        },
        body: WalkSchedule,
        response: { 200: { $ref: 'WalkSchedule#' } }
      }
    },
    updateWalk
  );

  // Client approves out-of-window change
  fastify.patch(
    '/walks/:walk_id/approve',
    {
      schema: {
        description: 'Client approves walk change outside window',
        tags: ['Scheduling'],
        params: {
          type: 'object',
          properties: { walk_id: { type: 'string', format: 'uuid' } },
          required: ['walk_id']
        },
        response: { 200: { $ref: 'WalkSchedule#' } }
      }
    },
    approveWalk
  );
}
