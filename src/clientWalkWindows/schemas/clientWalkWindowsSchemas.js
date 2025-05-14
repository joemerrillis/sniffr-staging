// src/clientWalkWindows/schemas/clientWalkWindowsSchemas.js

// Schema for a single client walk window
export const Window = {
  $id: 'ClientWalkWindow',
  type: 'object',
  properties: {
    id:              { type: 'string', format: 'uuid' },
    user_id:         { type: 'string', format: 'uuid' },
    day_of_week:     { type: 'integer', minimum: 0, maximum: 6 },
    window_start:    {
      type: 'string',
      pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'   // <-- HH:MM only
    },
    window_end:      {
      type: 'string',
      pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'   // <-- HH:MM only
    },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string','null'], format: 'date' },
    created_at:      { type: 'string', format: 'date-time' },
    updated_at:      { type: 'string', format: 'date-time' }
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

// Envelope for list responses
export const WindowsEnvelope = {
  $id: 'WindowsEnvelope',
  type: 'object',
  properties: {
    windows: {
      type: 'array',
      items: { $ref: 'ClientWalkWindow#' }
    }
  },
  required: ['windows']
};

// Envelope for single‐item responses
export const WindowEnvelope = {
  $id: 'WindowEnvelope',
  type: 'object',
  properties: {
    window: { $ref: 'ClientWalkWindow#' }
  },
  required: ['window']
};

// Body schema for creating a window
export const CreateWindow = {
  type: 'object',
  properties: {
    day_of_week:     { type: 'integer', minimum: 0, maximum: 6 },
    window_start:    { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
    window_end:      { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string','null'], format: 'date' }
  },
  required: [
    'day_of_week',
    'window_start',
    'window_end',
    'effective_start'
  ]
};

// Body schema for updating a window
export const UpdateWindow = {
  type: 'object',
  properties: {
    day_of_week:     { type: 'integer', minimum: 0, maximum: 6 },
    window_start:    { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
    window_end:      { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string','null'], format: 'date' }
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
