export const WalkSchedulingStatus = {
  type: 'string',
  enum: ['draft', 'scheduled', 'approved', 'pending_client_approval', 'completed', 'canceled']
};

export const WalkSchedule = {
  $id: 'WalkSchedule',
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    tenant_id:     { type: 'string', format: 'uuid' },
    dog_id:        { type: 'string', format: 'uuid' },
    walker_id:     { type: 'string', format: 'uuid' },
    client_id:     { type: 'string', format: 'uuid' },
    scheduled_at:  { type: ['string', 'null'], format: 'date-time' },
    status:        WalkSchedulingStatus,
    is_confirmed:  { type: 'boolean' },
    needs_client_approval: { type: 'boolean' },
    created_at:    { type: 'string', format: 'date-time' }
  },
  required: ['id','tenant_id','dog_id','walker_id','client_id','status','created_at']
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
