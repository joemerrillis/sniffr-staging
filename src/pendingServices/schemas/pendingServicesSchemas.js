// src/pendingServices/schemas/pendingServicesSchemas.js

export const PendingService = {
  $id: 'PendingService',
  type: 'object',
  properties: {
    id:                   { type: 'string', format: 'uuid' },
    user_id:              { type: 'string', format: 'uuid' },
    dog_id:               { type: ['string', 'null'], format: 'uuid' }, // LEGACY: allow null for backwards compatibility
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
    request_id:           { type: ['string', 'null'], format: 'uuid' }
  },
  required: [
    'id', 'user_id', 'service_date',
    'service_type', 'is_confirmed', 'created_at'
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
