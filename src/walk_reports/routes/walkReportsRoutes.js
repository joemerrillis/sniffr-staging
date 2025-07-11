// src/walk_reports/routes/walkReportsRoutes.js

import { createWalkReportController } from '../controller/createWalkReport.js';
import { updateWalkReportController } from '../controller/updateWalkReport.js';
import { getWalkReportController } from '../controller/getWalkReport.js';
import { listWalkReportsController } from '../controller/listWalkReports.js';
import { deleteWalkReportController } from '../controller/deleteWalkReport.js';
import { walkReportsSchemas } from '../schemas/walkReportsSchemas.js';
import { generateWalkReportController } from '../controller/generateWalkReport.js';
import { uploadWalkReportAudioController } from '../controller/uploadWalkReportAudio.js'; // <-- NEW
import { appendTranscriptEventsController } from '../controller/appendTranscriptEvents.js';

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

  // NEW: Generate captions/tags/story for a walk report
  fastify.post(
    '/:id/generate',
    {
      schema: {
        summary: 'Generate captions/tags/story for a walk report',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: walkReportsSchemas.WalkReportEnvelope
        },
        tags: ['WalkReports']
      }
    },
    generateWalkReportController
  );

  // NEW: Upload audio/recording for a walk report
  fastify.post(
    '/:id/record',
    {
      schema: {
        summary: 'Upload an audio recording for a walk report',
        consumes: ['multipart/form-data'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        body: {
          type: 'object',
          properties: {
            audio: { type: 'string', format: 'binary' } // Field must match form field name
          },
          required: ['audio']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              transcript: { type: 'string' }, // Optional, if returning transcript
              filename: { type: 'string' }
            },
            required: ['success', 'message']
          }
        },
        tags: ['WalkReports']
      }
    },
    uploadWalkReportAudioController
  );
fastify.post(
  '/:id/transcript',
  {
    schema: {
      summary: 'Process and append transcript events/tags for a walk report',
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          transcript: { type: 'string' },
          dog_id: { type: 'string', format: 'uuid' }
        },
        required: ['transcript', 'dog_id']
      },
      response: {
        200: walkReportsSchemas.TranscriptResponse
      },
      tags: ['WalkReports']
    }
  },
  appendTranscriptEventsController
);
}
