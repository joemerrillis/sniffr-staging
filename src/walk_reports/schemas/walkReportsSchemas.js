export const walkReportsSchemas = {
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
      created_at:  { type: 'string', format: 'date-time' },
      updated_at:  { type: 'string', format: 'date-time' }
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
      visibility:  { type: ['string', 'null'] }
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
      visibility:  { type: ['string', 'null'] }
    },
    additionalProperties: true
  }
};
