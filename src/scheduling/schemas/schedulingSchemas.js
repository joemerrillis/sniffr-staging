export const WalkSchedulingStatus = {
  type: 'string',
  enum: [
    'draft',
    'scheduled',
    'pending_client_approval',
    'approved',
    'completed',
    'canceled'
  ]
};

export const WalkSchedule = {
  $id: 'WalkSchedule',
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    tenant_id:     { type: 'string', format: 'uuid' },

    // LEGACY: dog_id (nullable; first of dog_ids, for backward compat)
    dog_id:        { type: ['string', 'null'], format: 'uuid' },

    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      minItems: 1
    },
    walker_id:     { type: 'string', format: 'uuid' },
    user_id:       { type: 'string', format: 'uuid' },

    scheduled_at:  { type: ['string', 'null'], format: 'date-time' },
    duration_minutes: { type: ['integer', 'null'] },
    block_label:   { type: ['string', 'null'] },

    status:        WalkSchedulingStatus,
    is_confirmed:  { type: 'boolean', default: false },
    needs_client_approval: { type: 'boolean', default: false },

    // Approval workflow
    rescheduled_by_client: { type: ['boolean', 'null'], default: null },
    rescheduled_at:        { type: ['string', 'null'], format: 'date-time' },
    requested_date:        { type: ['string', 'null'], format: 'date' },
    requested_block_label: { type: ['string', 'null'] },
    requested_start:       { type: ['string', 'null'], format: 'date-time' },
    requested_end:         { type: ['string', 'null'], format: 'date-time' },

    created_at:    { type: 'string', format: 'date-time' }
  },
  required: [
    'id',
    'tenant_id',
    'dog_ids',
    'walker_id',
    'user_id',
    'status',
    'created_at'
  ]
};

export const WalksScheduleEnvelope = {
  $id: 'WalksScheduleEnvelope',
  type: 'object',
  properties: {
    walks: {
      type: 'array',
      items: { $ref: 'WalkSchedule#' }
    }
  }
};
