export const ClientWalkWindow = {
  $id: 'ClientWalkWindow',
  type: 'object',
  properties: {
    id:               { type: 'string', format: 'uuid' },
    user_id:          { type: 'string', format: 'uuid' },
    tenant_id:        { type: 'string', format: 'uuid' }, // ADDED
    day_of_week:      { type: 'integer', minimum: 0, maximum: 6 },
    window_start: {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$'
    },
    window_end: {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$'
    },
    effective_start:  { type: 'string', format: 'date' },
    effective_end:    { type: ['string', 'null'], format: 'date' },
    created_at:       { type: 'string', format: 'date-time' },
    updated_at:       { type: 'string', format: 'date-time' },
    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    } // ADDED
  },
  required: [
    'id',
    'user_id',
    'tenant_id',
    'day_of_week',
    'window_start',
    'window_end',
    'effective_start',
    'created_at'
  ]
};

export const WindowsEnvelope = {
  $id: 'WindowsEnvelope',
  type: 'object',
  properties: {
    windows: {
      type: 'array',
      items: { $ref: 'ClientWalkWindow#' }
    }
  }
};

export const WindowEnvelope = {
  $id: 'WindowEnvelope',
  type: 'object',
  properties: {
    window: { $ref: 'ClientWalkWindow#' }
  }
};

export const CreateClientWalkWindow = {
  type: 'object',
  properties: {
    day_of_week:     { type: 'integer', minimum: 0, maximum: 6 },
    window_start:    { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    window_end:      { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string', 'null'], format: 'date' },
    tenant_id:       { type: 'string', format: 'uuid' }, // ADDED (can be omitted if always inferred in controller)
    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    } // ADDED
  },
  required: [
    'day_of_week',
    'window_start',
    'window_end',
    'effective_start',
    'dog_ids'
  ]
};

export const UpdateClientWalkWindow = {
  type: 'object',
  properties: {
    day_of_week:     { type: 'integer', minimum: 0, maximum: 6 },
    window_start:    { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    window_end:      { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string', 'null'], format: 'date' },
    tenant_id:       { type: 'string', format: 'uuid' }, // ADDED (if you want PATCH support)
    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    } // ADDED
  }
};

export const WeekQuery = {
  type: 'object',
  properties: {
    week_start: { type: 'string', format: 'date' }
  },
  required: ['week_start']
};
