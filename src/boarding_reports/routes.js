// src/boarding_reports/routes.js

import { boardingReportsSchemas } from './schemas/boardingReportsSchemas.js';
import {
  list,
  retrieve,
  create,
  modify,
  remove,
  completeTask,
  pushToClient,
} from './controllers/boardingReportsController.js';

export default async function boardingReportsRoutes(fastify) {
  // Tag for Swagger grouping
  const TAG = 'BoardingReports';

  // Register all schemas (envelope + object schemas)
  for (const schema of Object.values(boardingReportsSchemas)) {
    try {
      fastify.addSchema(schema);
    } catch (e) {
      // Ignore already-registered schema error
    }
  }

  // GET /boarding-reports — list/search
  fastify.get(
    '/boarding-reports',
    {
      schema: {
        tags: [TAG],
        summary: 'List or search boarding reports',
        description:
          'List/search boarding reports, filterable by dog_id, boarding_id, status, date range, etc. Only includes reports matching access/visibility rules.',
        querystring: boardingReportsSchemas.BoardingReportListQuery,
        response: {
          200: boardingReportsSchemas.BoardingReportsEnvelope,
        },
      },
    },
    list
  );

  // GET /boarding-reports/:id — retrieve single report
  fastify.get(
    '/boarding-reports/:id',
    {
      schema: {
        tags: [TAG],
        summary: 'Retrieve single boarding report',
        description: 'Retrieve a single boarding report by id, with all visible fields.',
        params: boardingReportsSchemas.BoardingReportIdParam,
        response: {
          200: boardingReportsSchemas.BoardingReportEnvelope,
        },
      },
    },
    retrieve
  );

  // POST /boarding-reports — create
  fastify.post(
    '/boarding-reports',
    {
      schema: {
        tags: [TAG],
        summary: 'Create new boarding report',
        description:
          'Create a new boarding report for a dog and boarding. Enforces one report per dog per boarding. Tasks are auto-filled from owner instructions if available.',
        body: boardingReportsSchemas.CreateBoardingReportBody,
        response: {
          201: boardingReportsSchemas.BoardingReportEnvelope,
        },
      },
    },
    create
  );

  // PATCH /boarding-reports/:id — update
  fastify.patch(
    '/boarding-reports/:id',
    {
      schema: {
        tags: [TAG],
        summary: 'Update a boarding report',
        description:
          'Update fields in a boarding report (tasks, summary, notes, status, etc). Only allowed for assigned staff/admin.',
        params: boardingReportsSchemas.BoardingReportIdParam,
        body: boardingReportsSchemas.UpdateBoardingReportBody,
        response: {
          200: boardingReportsSchemas.BoardingReportEnvelope,
        },
      },
    },
    modify
  );

  // DELETE /boarding-reports/:id — delete
  fastify.delete(
    '/boarding-reports/:id',
    {
      schema: {
        tags: [TAG],
        summary: 'Delete (admin only) a boarding report',
        description:
          'Remove a boarding report (soft or hard delete; admin only). Cleans up as needed.',
        params: boardingReportsSchemas.BoardingReportIdParam,
        response: {
          200: boardingReportsSchemas.DeleteResultEnvelope,
        },
      },
    },
    remove
  );

  // POST /boarding-reports/:id/complete-task — mark a checklist task as completed (optional, atomic)
  fastify.post(
    '/boarding-reports/:id/complete-task',
    {
      schema: {
        tags: [TAG],
        summary: 'Complete a single task in a boarding report checklist',
        description:
          'Mark a specific task as completed for this boarding report. Used for atomic checklist updates.',
        params: boardingReportsSchemas.BoardingReportIdParam,
        body: boardingReportsSchemas.CompleteTaskBody,
        response: {
          200: boardingReportsSchemas.BoardingReportEnvelope,
        },
      },
    },
    completeTask
  );

  // POST /boarding-reports/:id/push-to-client — push report update to client (optional, manual)
  fastify.post(
    '/boarding-reports/:id/push-to-client',
    {
      schema: {
        tags: [TAG],
        summary: 'Push boarding report update/notification to client',
        description:
          'Manually push a summary, final report, or new photo update to the client. Triggers notification integration.',
        params: boardingReportsSchemas.BoardingReportIdParam,
        body: boardingReportsSchemas.PushToClientBody,
        response: {
          200: boardingReportsSchemas.PushToClientResultEnvelope,
        },
      },
    },
    pushToClient
  );
}

/**
 * 📸 Photo Handling Convention (reference for all endpoints)
 *
 * - All photo/media uploads are done via the `dog_memories` plugin.
 * - To associate a photo with a boarding report, upload to `dog_memories`
 *   with meta: { boarding_id, dog_id, source: 'boarding_report' }.
 * - The boarding_report's `photos` field contains references (not blobs),
 *   typically array of objects with { dog_memory_id, image_url, meta, ... }.
 * - No direct photo upload on boarding_reports routes!
 */
