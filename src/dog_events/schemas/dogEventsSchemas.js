// src/dog_events/schemas/dogEventsSchemas.js

export const dogEventsSchemas = {
  // For POST/PUT (client must supply these)
  CreateDogEvent: {
    $id: 'CreateDogEvent',
    type: 'object',
    properties: {
      report_id: { type: 'string', format: 'uuid' },
      dog_id:    { type: 'string', format: 'uuid' },
      source:    { type: 'string' },
      event_type:{ type: 'string' },
      tags:      { type: 'array', items: { type: 'string' } },
      user_id:   { type: 'string', format: 'uuid' },      // Optional, but useful
      memory_id: { type: ['string', 'null'], format: 'uuid' },
      context:   { type: ['object', 'null'], additionalProperties: true },
      note:      { type: ['string', 'null'] },
      visibility:{ type: ['string', 'null'] }
    },
    required: ['report_id', 'dog_id', 'source', 'event_type', 'tags'],
    additionalProperties: true,
  },

  // For GET/Response (server returns all fields)
  DogEvent: {
    $id: 'DogEvent',
    type: 'object',
    properties: {
      id:        { type: 'string', format: 'uuid' },        // present on responses
      report_id: { type: 'string', format: 'uuid' },
      dog_id:    { type: 'string', format: 'uuid' },
      user_id:   { type: 'string', format: 'uuid' },
      source:    { type: 'string' },
      event_type:{ type: 'string' },
      tags:      { type: 'array', items: { type: 'string' } },
      memory_id: { type: ['string', 'null'], format: 'uuid' },
      context:   { type: ['object', 'null'], additionalProperties: true },
      note:      { type: ['string', 'null'] },
      visibility:{ type: ['string', 'null'] },
      created_at:{ type: 'string', format: 'date-time' }
    },
    required: ['id', 'report_id', 'dog_id', 'source', 'event_type', 'tags', 'created_at'],
    additionalProperties: true,
  },

  DogEventsEnvelope: {
    $id: 'DogEventsEnvelope',
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: { $ref: 'DogEvent#' }
      }
    }
  },

  SingleDogEventEnvelope: {
    $id: 'SingleDogEventEnvelope',
    type: 'object',
    properties: {
      event: { $ref: 'DogEvent#' }
    }
  }
};
