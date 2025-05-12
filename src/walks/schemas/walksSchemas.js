export const Walk = {
  type: 'object',
  properties: {
    id:               { type: 'string', format: 'uuid' },
    tenant_id:        { type: 'string', format: 'uuid' },
    client_id:        { type: ['string', 'null'], format: 'uuid' },
    dog_id:           { type: 'string', format: 'uuid' },
    walker_id:        { type: ['string','null'], format: 'uuid' },
    requested_date:   { type: 'string', format: 'date' },
    requested_start:  { type: ['string','null'], format: 'date-time' },
    requested_end:    { type: ['string','null'], format: 'date-time' },
    block_label:      { type: 'string' },
    scheduled_at:     { type: ['string','null'], format: 'date-time' },
    is_confirmed:     { type: 'boolean' },
    status:           { type: 'string' },
    duration_minutes: { type: 'integer' },
    created_at:       { type: 'string', format: 'date-time' }
  },
  required: ['id','tenant_id','dog_id','block_label','status','created_at']
};

export const CreateWalk = {
  type: 'object',
  properties: {
    tenant_id:       { type: 'string', format: 'uuid' },
    client_id:       { type: ['string','null'], format: 'uuid' },
    dog_id:          { type: 'string', format: 'uuid' },
    window_id:       { type: ['string','null'], format: 'uuid' },
    requested_date:  { type: 'string', format: 'date' },
    block_label:     { type: 'string' },
    duration_minutes:{ type: 'integer' },
    requested_start: { type: ['string','null'], format: 'date-time' },
    requested_end:   { type: ['string','null'], format: 'date-time' }
  },
  required: ['tenant_id','dog_id','requested_date','block_label','duration_minutes']
};

export const UpdateWalk = {
  type: 'object',
  properties: {
    walker_id:    { type: 'string', format: 'uuid' },
    scheduled_at: { type: 'string', format: 'date-time' },
    is_confirmed: { type: 'boolean' }
  }
};

export const DayQuery = {
  type: 'object',
  properties: {
    date:              { type: 'string', format: 'date' },
    fallback_last_week:{ type: 'boolean' }
  },
  required: ['date']
};

export const ConfirmDayBody = {
  type: 'object',
  properties: {
    date: { type: 'string', format: 'date' }
  },
  required: ['date']
};

export const CloneWeekBody = {
  type: 'object',
  properties: {
    from_week_start: { type: 'string', format: 'date' },
    to_week_start:   { type: 'string', format: 'date' }
  },
  required: ['from_week_start','to_week_start']
};
