export const assignmentSchemas = {
  Assignment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      dog_id: { type: 'string', format: 'uuid' },
      walker_id: { type: 'string', format: 'uuid' },
      source: { type: 'string', enum: ['tenant','owner'] },
      priority: { type: 'integer' },
      start_date: { type: 'string', format: 'date' },
      end_date: { type: ['string', 'null'], format: 'date' },
      reason_ended: { type: ['string', 'null'] },
      created_at: { type: 'string', format: 'date-time' }
    },
    required: ['id','dog_id','walker_id','source','priority','start_date','created_at']
  },
  CreateAssignment: {
    type: 'object',
    properties: {
      dog_id: { type: 'string', format: 'uuid' },
      walker_id: { type: 'string', format: 'uuid' },
      source: { type: 'string', enum: ['tenant','owner'], default: 'tenant' },
      priority: { type: 'integer', default: 100 },
      start_date: { type: 'string', format: 'date' },
      end_date: { type: ['string', 'null'], format: 'date' },
      reason_ended: { type: ['string', 'null'] }
    },
    required: ['dog_id','walker_id','source','priority','start_date']
  },
  UpdateAssignment: {
    type: 'object',
    properties: {
      source: { type: 'string', enum: ['tenant','owner'] },
      priority: { type: 'integer' },
      start_date: { type: 'string', format: 'date' },
      end_date: { type: ['string', 'null'], format: 'date' },
      reason_ended: { type: ['string', 'null'] }
    },
    required: []
  }
};
