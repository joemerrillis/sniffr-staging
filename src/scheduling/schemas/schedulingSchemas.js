// src/scheduling/schemas/schedulingSchemas.js

export const WalkSchedulingStatus = {
  type: 'string',
  enum: [
    'draft',
    'scheduled',
    'approved',
    'pending_client_approval',
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
    dog_id:        { type: 'string', format: 'uuid' }, // for legacy clients (can be first of dog_ids)
    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    },
    walker_id:     { type: 'string', format: 'uuid' },
    user_id:       { type: 'string', format: 'uuid' },
    scheduled_at:  { type: ['string', 'null'], format: 'date-time' },
    status:        WalkSchedulingStatus,
    is_confirmed:  { type: 'boolean' },
    needs_client_approval: { type: 'boolean' },
    created_at:    { type: 'string', format: 'date-time' }
  },
  required: [
    'id',
    'tenant_id',
    'dog_ids',     // <-- now required!
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
