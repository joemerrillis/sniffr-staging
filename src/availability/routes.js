// src/availability/routes.js

import {
  getGlobalHeatmap,
  getDogHeatmap,
  getBlackouts
} from './controllers/availabilityController.js';

import { HeatmapEnvelope, BlackoutEnvelope } from './schemas/availabilitySchemas.js';

export default async function availabilityRoutes(fastify, opts) {
  // Global business heatmap
  fastify.get(
    '/global',
    {
      schema: {
        description: 'Global business heatmap for all walkers (anonymized).',
        tags: ['Availability'],
        querystring: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            walk_length: { type: 'integer', default: 30 }
          },
          required: ['date']
        },
        response: {
          200: HeatmapEnvelope
        }
      }
    },
    getGlobalHeatmap
  );

  // Dog-specific heatmap (just primary/backup walkers)
  fastify.get(
    '/dog/:dog_id',
    {
      schema: {
        description: 'Heatmap for all assigned walkers to this dog (anonymized).',
        tags: ['Availability'],
        params: {
          type: 'object',
          properties: { dog_id: { type: 'string', format: 'uuid' } },
          required: ['dog_id']
        },
        querystring: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            walk_length: { type: 'integer', default: 30 }
          },
          required: ['date']
        },
        response: {
          200: HeatmapEnvelope
        }
      }
    },
    getDogHeatmap
  );

  // Business blackouts (closed days)
  fastify.get(
    '/settings/blackouts',
    {
      schema: {
        description: 'Get tenant blackout days (unavailable days).',
        tags: ['Availability'],
        response: {
          200: BlackoutEnvelope
        }
      }
    },
    getBlackouts
  );
}
