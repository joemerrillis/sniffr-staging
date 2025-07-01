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
      summary: { type: 'string' },
      ai_story_json: { type: 'array', items: { type: 'object' } },
      stats_json: { type: 'object' },
      survey_json: { type: 'object' },
      visibility: { type: 'string' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'walk_id', 'dog_id', 'walker_id', 'client_id']
  },
  CreateWalkReport: {
    $id: 'CreateWalkReport',
    type: 'object',
    properties: {
      walk_id: { type: 'string', format: 'uuid' },
      dog_id: { type: 'string', format: 'uuid' },
      walker_id: { type: 'string', format: 'uuid' },
      client_id: { type: 'string', format: 'uuid' },
      summary: { type: 'string' },
      ai_story_json: { type: 'array', items: { type: 'object' } },
      stats_json: { type: 'object' },
      survey_json: { type: 'object' },
      visibility: { type: 'string' }
    },
    required: ['walk_id', 'dog_id', 'walker_id', 'client_id']
  },
  UpdateWalkReport: {
    $id: 'UpdateWalkReport',
    type: 'object',
    properties: {
      summary: { type: 'string' },
      ai_story_json: { type: 'array', items: { type: 'object' } },
      stats_json: { type: 'object' },
      survey_json: { type: 'object' },
      visibility: { type: 'string' }
    }
  },
  WalkReportDetailed: {
    $id: 'WalkReportDetailed',
    type: 'object',
    // You can elaborate for /:id/details endpoint if you want
  }
};
