// src/clientWalkRequests/schemas/clientWalkRequestsSchemas.js
export const ClientWalkRequest = {
  $id: 'ClientWalkRequest',
  type: 'object',
  properties: {
    id:            { type: 'string', format: 'uuid' },
    user_id:       { type: 'string', format: 'uuid' },
    walk_date:     { type: 'string', format: 'date' },
    window_start:  { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$' },
    window_end:    { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$' },
    created_at:    { type: 'string', format: 'date-time' }
  },
  required: ['id','user_id','walk_date','window_start','window_end','created_at']
};

export const RequestsEnvelope = {
  $id: 'RequestsEnvelope',
  type: 'object',
  properties: {
    requests: {
      type: 'array',
      items: { $ref: 'ClientWalkRequest#' }
    }
  }
};

export const RequestEnvelope = {
  $id: 'RequestEnvelope',
  type: 'object',
  properties: {
    request: { $ref: 'ClientWalkRequest#' }
  }
};

export const CreateClientWalkRequest = {
  type: 'object',
  properties: {
    walk_date:    { type: 'string', format: 'date' },
    window_start: { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    window_end:   { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' }
  },
  required: ['walk_date','window_start','window_end']
};

export const UpdateClientWalkRequest = {
  type: 'object',
  properties: {
    walk_date:    { type: 'string', format: 'date' },
    window_start: { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    window_end:   { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' }
  }
};
