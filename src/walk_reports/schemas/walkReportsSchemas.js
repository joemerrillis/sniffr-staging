// src/walk_reports/schemas/walkReportsSchemas.js

export const walkReportsSchemas = {
  // Envelope for responses: { report: { ... } }
  WalkReportEnvelope: {
    $id: 'WalkReportEnvelope',
    type: 'object',
    properties: {
      report: { $ref: 'WalkReport#' }
    },
    required: ['report'],
    additionalProperties: false
  },
  WalkReportsEnvelope: {
    $id: 'WalkReportsEnvelope',
    type: 'object',
    properties: {
      reports: {
        type: 'array',
        items: { $ref: 'WalkReport#' }
      }
    },
    required: ['reports'],
    additionalProperties: false
  },
  WalkReport: {
    $id: 'WalkReport',
    type: 'object',
    properties: {
      id:         { type: 'string', format: 'uuid' },
      walk_id:    { type: 'string', format: 'uuid' },
      dog_ids:    {
        type: 'array',
        items: { type: 'string', format: 'uuid' }
      },
      walker_id:  { type: 'string', format: 'uuid' },
      user_id:    { type: 'string', format: 'uuid' }, // replaces client_id
      summary:    { type: ['string', 'null'] },
      ai_story_json: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', format: 'uuid' },
            ai_caption: { type: 'string' }
          },
          required: ['memory_id', 'ai_caption'],
          additionalProperties: true
        }
      },
      stats_json:  { type: ['object', 'null'], additionalProperties: true },
      survey_json: { type: ['object', 'null'], additionalProperties: true },
      visibility:  { type: ['string', 'null'] },
      photos: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            url: { type: 'string' },
            ai_caption: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            dog_ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' }
            }
          },
          required: ['id', 'url'],
          additionalProperties: true
        }
      },
      created_at:  { type: ['string', 'null'], format: 'date-time' },
      updated_at:  { type: ['string', 'null'], format: 'date-time' }
    },
    required: [
       'id', 'walk_id', 'dog_ids', 'walker_id', 'user_id', 'created_at', 'updated_at'
    ],
    additionalProperties: true
  },
  CreateWalkReport: {
    $id: 'CreateWalkReport',
    type: 'object',
    properties: {
      walk_id:   { type: 'string', format: 'uuid' },
      dog_ids:   {
        type: 'array',
        items: { type: 'string', format: 'uuid' }
      },
      walker_id: { type: 'string', format: 'uuid' },
      user_id:   { type: 'string', format: 'uuid' }, // replaces client_id
      summary:   { type: ['string', 'null'] },
      ai_story_json: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', format: 'uuid' },
            ai_caption: { type: 'string' }
          },
          required: ['memory_id', 'ai_caption'],
          additionalProperties: true
        }
      },
      stats_json:  { type: ['object', 'null'], additionalProperties: true },
      survey_json: { type: ['object', 'null'], additionalProperties: true },
      visibility:  { type: ['string', 'null'] },
      photos: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            url: { type: 'string' },
            ai_caption: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            dog_ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' }
            }
          },
          required: ['id', 'url'],
          additionalProperties: true
        }
      }
    },
    required: ['walk_id', 'dog_ids', 'walker_id', 'user_id'],
    additionalProperties: true
  },
  UpdateWalkReport: {
    $id: 'UpdateWalkReport',
    type: 'object',
    properties: {
      summary:   { type: ['string', 'null'] },
      ai_story_json: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            memory_id: { type: 'string', format: 'uuid' },
            ai_caption: { type: 'string' }
          },
          required: ['memory_id', 'ai_caption'],
          additionalProperties: true
        }
      },
      stats_json:  { type: ['object', 'null'], additionalProperties: true },
      survey_json: { type: ['object', 'null'], additionalProperties: true },
      visibility:  { type: ['string', 'null'] },
      photos: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            url: { type: 'string' },
            ai_caption: { type: 'string' },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            dog_ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' }
            }
          },
          required: ['id', 'url'],
          additionalProperties: true
        }
      }
    },
    additionalProperties: true
  }
};
