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

export default async function walkReportsRoutes(fastify, opts) {
  fastify.post(
    '/',
    {
      schema: {
        body: walkReportsSchemas.CreateWalkReport,
        response: {
          201: walkReportsSchemas.WalkReport
        },
        tags: ['WalkReports'],
        summary: 'Create a new walk report'
      }
    },
    createWalkReportController
  );

  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: walkReportsSchemas.WalkReport
          }
        },
        tags: ['WalkReports'],
        summary: 'List all walk reports'
      }
    },
    listWalkReportsController
  );

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
          200: walkReportsSchemas.WalkReport
        },
        tags: ['WalkReports'],
        summary: 'Retrieve a single walk report'
      }
    },
    getWalkReportController
  );

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
          200: walkReportsSchemas.WalkReport
        },
        tags: ['WalkReports'],
        summary: 'Update a walk report'
      }
    },
    updateWalkReportController
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: { 200: { type: 'object', properties: { deleted: { type: 'boolean' } } } },
        tags: ['WalkReports'],
        summary: 'Delete a walk report'
      }
    },
    deleteWalkReportController
  );
}
