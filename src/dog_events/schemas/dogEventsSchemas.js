console.trace('dogEventsSchemas loaded');

export const dogEventsSchemas = {};

dogEventsSchemas.DogEvents_DogEvent = {
  $id: 'DogEvents_DogEvent',
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    report_id: { type: ['string', 'null'], format: 'uuid' },
    dog_id: { type: 'string', format: 'uuid' },
    user_id: { type: ['string', 'null'], format: 'uuid' },
    source: { type: 'string' }, // walker, owner, system, trainer, etc
    event_type: { type: 'string' }, // walk, home, daycare, etc
    tags: {
      type: ['array', 'null'],
      items: { type: 'string' }
    },
    memory_id: { type: ['string', 'null'], format: 'uuid' },
    context: { type: ['object', 'null'], additionalProperties: true },
    note: { type: ['string', 'null'] },
    visibility: { type: ['string', 'null'] },
    created_at: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'dog_id', 'source', 'event_type', 'created_at'],
  additionalProperties: true
};

dogEventsSchemas.CreateDogEvent = {
  $id: 'DogEvents_CreateDogEvent',
  type: 'object',
  properties: {
    report_id: { type: ['string', 'null'], format: 'uuid' },
    dog_id: { type: 'string', format: 'uuid' },
    user_id: { type: ['string', 'null'], format: 'uuid' },
    source: { type: 'string' },
    event_type: { type: 'string' },
    tags: { type: ['array', 'null'], items: { type: 'string' } },
    memory_id: { type: ['string', 'null'], format: 'uuid' },
    context: { type: ['object', 'null'], additionalProperties: true },
    note: { type: ['string', 'null'] },
    visibility: { type: ['string', 'null'] }
  },
  required: ['dog_id', 'source', 'event_type'],
  additionalProperties: true
};

dogEventsSchemas.UpdateDogEvent = {
  $id: 'DogEvents_UpdateDogEvent',
  type: 'object',
  properties: {
    tags: { type: ['array', 'null'], items: { type: 'string' } },
    note: { type: ['string', 'null'] },
    context: { type: ['object', 'null'], additionalProperties: true },
    visibility: { type: ['string', 'null'] }
  },
  additionalProperties: true
};

dogEventsSchemas.BulkCreateDogEvents = {
  $id: 'DogEvents_BulkCreateDogEvents',
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: dogEventsSchemas.CreateDogEvent
    }
  },
  required: ['events'],
  additionalProperties: true
};

dogEventsSchemas.BulkCreateDogEventsResponse = {
  $id: 'DogEvents_BulkCreateDogEventsResponse',
  type: 'object',
  properties: {
    created: {
      type: 'array',
      items: dogEventsSchemas.DogEvents_DogEvent
    }
  }
};

dogEventsSchemas.ListDogEventsQuery = {
  $id: 'DogEvents_ListDogEventsQuery',
  type: 'object',
  properties: {
    dog_id: { type: 'string', format: 'uuid' },
    event_type: { type: 'string' },
    source: { type: 'string' },
    tag: { type: 'string' }
  }
};
