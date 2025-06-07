export const PricePreview = {
  $id: 'PricePreview',
  type: 'object',
  properties: {
    price: { type: 'number' },
    breakdown: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          rule_type: { type: 'string' },
          description: { type: 'string' },
          adjustment: { type: 'number' },
          price_so_far: { type: 'number' }
        }
      }
    },
    error: { type: 'string' }
  }
};

export const ClientWalkWindow = {
  $id: 'ClientWalkWindow',
  type: 'object',
  properties: {
    id:               { type: 'string', format: 'uuid' },
    user_id:          { type: 'string', format: 'uuid' },
    tenant_id:        { type: 'string', format: 'uuid' },
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
    },
    price_preview: { $ref: 'PricePreview#' } // ADDED: Each window can include a price preview
  },
  required: [
    'id',
    'user_id',
    'tenant_id',
    'day_of_week',
    'window_start',
    'window_end',
    'effective_start',
    'created_at',
    'price_preview'
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
    tenant_id:       { type: 'string', format: 'uuid' },
    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    }
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
    tenant_id:       { type: 'string', format: 'uuid' },
    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    }
  }
};

export const WeekQuery = {
  type: 'object',
  properties: {
    week_start: { type: 'string', format: 'date' }
  },
  required: ['week_start']
};
