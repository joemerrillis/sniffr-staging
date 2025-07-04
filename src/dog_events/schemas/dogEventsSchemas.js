// src/dog_events/schemas/dogEventsSchemas.js

export const dogEventsSchemas = {
  DogEvent: {
    $id: 'DogEvent',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      report_id: { type: ['string', 'null'], format: 'uuid' },   // FK walk_reports.id
      dog_id: { type: 'string', format: 'uuid' },                // FK dogs.id
      user_id: { type: ['string', 'null'], format: 'uuid' },     // FK users.id (walker or admin)
      source: { type: 'string' },
      event_type: { type: 'string' },
      tags: {
        type: 'array',
        items: { type: 'string' }
      },
      memory_id: { type: ['string', 'null'], format: 'uuid' },   // FK dog_memories.id
      context: { type: ['object', 'null'], additionalProperties: true },
      note: { type: ['string', 'null'] },
      visibility: { type: ['string', 'null'], default: 'private' },
      created_at: { type: ['string', 'null'], format: 'date-time' }
    },
    required: ['id', 'report_id', 'dog_id', 'source', 'event_type', 'tags'],
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
