// src/pendingServices/schemas/pendingServicesSchemas.js

export const PendingService = {
  $id: 'PendingService',
  type: 'object',
  properties: {
    id:                  { type: 'string', format: 'uuid' },
    user_id:             { type: 'string', format: 'uuid' },
    service_date:        { type: 'string', format: 'date' },
    service_type:        { type: 'string', enum: ['walk_window','walk_request','boarding','daycare'] },
    walk_window_id:      { type: ['string','null'], format: 'uuid' },
    request_id:          { type: ['string','null'], format: 'uuid' },
    boarding_request_id: { type: ['string','null'], format: 'uuid' },
    daycare_request_id:  { type: ['string','null'], format: 'uuid' },
    details:             { type: 'object' },
    is_confirmed:        { type: 'boolean' },
    created_at:          { type: 'string', format: 'date-time' }
  }
};

export const PendingServicesEnvelope = {
  $id: 'PendingServicesEnvelope',
  type: 'object',
  properties: {
    pending_services: {
      type: 'array',
      items: { $ref: 'PendingService#' }
    }
  }
};

export const PendingServiceEnvelope = {
  $id: 'PendingServiceEnvelope',
  type: 'object',
  properties: {
    pending_service: { $ref: 'PendingService#' }
  }
};

export const ListQuery = {
  type: 'object',
  properties: {
    week_start: { type: 'string', format: 'date' }
  },
  required: ['week_start']
};

export const SeedQuery = {
  type: 'object',
  properties: {
    week_start: { type: 'string', format: 'date' }
  },
  required: ['week_start']
};
