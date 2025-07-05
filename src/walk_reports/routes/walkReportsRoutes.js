// src/walk_reports/routes/walkReportsRoutes.js

import {
  createWalkReportController,
} from '../controller/createWalkReport.js';
import {
  updateWalkReportController,
} from '../controller/updateWalkReport.js';
import {
  getWalkReportController,
} from '../controller/getWalkReport.js';
import {
  listWalkReportsController,
} from '../controller/listWalkReports.js';
import {
  deleteWalkReportController,
} from '../controller/deleteWalkReport.js';
import { walkReportsSchemas } from '../schemas/walkReportsSchemas.js';
import { 
 generateWalkReportController // <--- New controller for /generate
} from './controllers/walkReportsController.js';

export default async function walkReportsRoutes(fastify, opts) {
  // Create a walk report
  fastify.post(
    '/',
    {
      schema: {
        body: walkReportsSchemas.CreateWalkReport,
        response: {
          201: walkReportsSchemas.WalkReportEnvelope
        },
        tags: ['WalkReports'],
        summary: 'Create a new walk report'
      }
    },
    createWalkReportController
  );

  // Update a walk report
  fastify.patch(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: walkReportsSchemas.UpdateWalkReport,
        response: {
          200: walkReportsSchemas.WalkReportEnvelope
        },
        tags: ['WalkReports'],
        summary: 'Update an existing walk report'
      }
    },
    updateWalkReportController
  );

  // Get a walk report by ID
  fastify.get(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: walkReportsSchemas.WalkReportEnvelope
        },
        tags: ['WalkReports'],
        summary: 'Get walk report by ID'
      }
    },
    getWalkReportController
  );

  // List walk reports (optionally filter)
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            walk_id: { type: 'string', format: 'uuid' },
            dog_id: { type: 'string', format: 'uuid' },
            walker_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' }
          }
        },
        response: {
          200: walkReportsSchemas.WalkReportsEnvelope
        },
        tags: ['WalkReports'],
        summary: 'List walk reports'
      }
    },
    listWalkReportsController
  );

  // Delete a walk report
  fastify.delete(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              deleted: { type: 'boolean' }
            },
            required: ['deleted']
          }
        },
        tags: ['WalkReports'],
        summary: 'Delete walk report'
      }
    },
    deleteWalkReportController
  );
    // NEW: /walk-reports/:id/generate
  fastify.post('/walk-reports/:id/generate', {
    handler: generateWalkReportController,
    schema: {
      summary: 'Generate captions/tags/story for a walk report',
      params: { id: { type: 'string', format: 'uuid' } },
      response: { 200: { type: 'object', properties: { report: { type: 'object' } } } }
    },
    tags: ['WalkReports'],
  });

  done();
}
}
