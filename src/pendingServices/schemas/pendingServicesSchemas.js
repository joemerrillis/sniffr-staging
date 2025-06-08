// src/pendingServices/schemas/pendingServicesSchemas.js

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
          id: { type: 'string', format: 'uuid' },
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

export const PendingService = {
  $id: 'PendingService',
  type: 'object',
  properties: {
    id:                   { type: 'string', format: 'uuid' },
    user_id:              { type: 'string', format: 'uuid' },
    dog_id:               { type: ['string', 'null'], format: 'uuid' }, // LEGACY support for old rows
    dog_ids: {
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    }, // MODERN: always present for new services
    service_date:         { type: 'string', format: 'date' },
    service_type:         { type: 'string' }, // Enum if you have fixed values
    walk_window_id:       { type: ['string', 'null'], format: 'uuid' },
    daycare_request_id:   { type: ['string', 'null'], format: 'uuid' },
    boarding_request_id:  { type: ['string', 'null'], format: 'uuid' },
    details:              { type: ['object', 'null'] }, // JSONB
    is_confirmed:         { type: 'boolean' },
    created_at:           { type: 'string', format: 'date-time' },
    request_id:           { type: ['string', 'null'], format: 'uuid' },
    price_preview:        { $ref: 'PricePreview#' } // NEW!
  },
  required: [
    'id', 'user_id', 'service_date',
    'service_type', 'is_confirmed', 'created_at'
    // price_preview is *not* required for old/legacy rows
  ]
};

export const PendingServicesEnvelope = {
  $id: 'PendingServicesEnvelope',
  type: 'object',
  properties: {
    pending_services: {
      type: 'array',
      items: { $ref: 'PendingService#' }
    }
  },
  required: ['pending_services']
};

export const PendingServiceEnvelope = {
  $id: 'PendingServiceEnvelope',
  type: 'object',
  properties: {
    pending_service: { $ref: 'PendingService#' }
  },
  required: ['pending_service']
};
