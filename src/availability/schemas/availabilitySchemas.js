// src/availability/schemas/availabilitySchemas.js

export const HeatmapSlot = {
  type: 'object',
  properties: {
    time:    { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' }, // "HH:mm"
    busy:    { type: 'integer', minimum: 0 }, // how many walkers are busy
    available: { type: 'boolean' }, // is the interval available for requested length?
  },
  required: ['time', 'busy', 'available']
};

export const HeatmapEnvelope = {
  $id: 'HeatmapEnvelope',
  type: 'object',
  properties: {
    date:     { type: 'string', format: 'date' },
    slots:    { type: 'array', items: HeatmapSlot },
    suggested: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
          end:   { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' }
        },
        required: ['start', 'end']
      }
    }
  },
  required: ['date', 'slots']
};

export const BlackoutEnvelope = {
  $id: 'BlackoutEnvelope',
  type: 'object',
  properties: {
    blackouts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day:  { type: 'string', format: 'date' },
          note: { type: 'string' }
        },
        required: ['day']
      }
    }
  }
};
