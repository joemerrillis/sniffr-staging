// src/clientWalkWindows/schemas/clientWalkWindowsSchemas.js

export const ClientWalkWindow = {
  $id: 'ClientWalkWindow',
  type: 'object',
  properties: {
    id:               { type: 'string', format: 'uuid' },
    user_id:          { type: 'string', format: 'uuid' },
    day_of_week:      { type: 'integer', minimum: 0, maximum: 6 },
    // allow optional seconds, since your DB returns "HH:MM:SS"
    window_start: {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$'
    },
    window_end: {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$'
    },
    effective_start:  { type: 'string', format: 'date' },
    // allow null if omitted
    effective_end:    { type: ['string', 'null'], format: 'date' },
    created_at:       { type: 'string', format: 'date-time' },
    updated_at:       { type: 'string', format: 'date-time' }
  },
  required: [
    'id',
    'user_id',
    'day_of_week',
    'window_start',
    'window_end',
    'effective_start'
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
    window_start:    {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$'  // omit seconds on input
    },
    window_end:      {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$'
    },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string', 'null'], format: 'date' }
  },
  required: [
    'day_of_week',
    'window_start',
    'window_end',
    'effective_start'
  ]
};

export const UpdateClientWalkWindow = {
  type: 'object',
  properties: {
    day_of_week:     { type: 'integer', minimum: 0, maximum: 6 },
    window_start:    {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$'
    },
    window_end:      {
      type: 'string',
      pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$'
    },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string', 'null'], format: 'date' }
  }
};


// Query schema for listing windows in a week
export const WeekQuery = {
  type: 'object',
  properties: {
    week_start: { type: 'string', format: 'date' }
  },
  required: ['week_start']
};
