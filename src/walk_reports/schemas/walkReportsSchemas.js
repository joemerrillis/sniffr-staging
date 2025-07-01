export const walkReportsSchemas = {
  WalkReport: {
    $id: 'WalkReport',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      walk_id: { type: 'string', format: 'uuid' },
      dog_id: { type: 'string', format: 'uuid' },
      walker_id: { type: 'string', format: 'uuid' },
      client_id: { type: 'string', format: 'uuid' },
      summary: { type: ['string', 'null'] },
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
      stats_json: { type: ['object', 'null'], additionalProperties: true },
      survey_json: { type: ['object', 'null'], additionalProperties: true },
      visibility: { type: ['string', 'null'] },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'walk_id', 'dog_id', 'walker_id', 'client_id', 'created_at'],
    additionalProperties: true
  },
  CreateWalkReport: {
    $id: 'CreateWalkReport',
    type: 'object',
    properties: {
      walk_id: { type: 'string', format: 'uuid' },
      dog_id: { type: 'string', format: 'uuid' },
      walker_id: { type: 'string', format: 'uuid' },
      client_id: { type: 'string', format: 'uuid' },
      summary: { type: ['string', 'null'] },
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
      stats_json: { type: ['object', 'null'], additionalProperties: true },
      survey_json: { type: ['object', 'null'], additionalProperties: true },
      visibility: { type: ['string', 'null'] }
    },
    required: ['walk_id', 'dog_id', 'walker_id', 'client_id'],
    additionalProperties: true
  },
  UpdateWalkReport: {
    $id: 'UpdateWalkReport',
    type: 'object',
    properties: {
      summary: { type: ['string', 'null'] },
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
      stats_json: { type: ['object', 'null'], additionalProperties: true },
      survey_json: { type: ['object', 'null'], additionalProperties: true },
      visibility: { type: ['string', 'null'] }
    },
    additionalProperties: true
  }
};
