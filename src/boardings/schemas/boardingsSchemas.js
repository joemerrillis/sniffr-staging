// src/boardings/schemas/boardingsSchemas.js

export const boardingSchemas = {
  Boarding: {
    type: 'object',
    properties: {
      id:                   { type: 'string', format: 'uuid' },
      tenant_id:            { type: 'string', format: 'uuid' },
      dog_id:               { type: 'string', format: 'uuid' },
      drop_off_day:         { type: 'string', format: 'date' },
      drop_off_block:       { type: 'string' },
      drop_off_time:        { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$' },
      pick_up_day:          { type: 'string', format: 'date' },
      pick_up_block:        { type: 'string' },
      pick_up_time:         { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)(:[0-5]\\d)?$' },
      price:                { type: 'number' },
      status:               { type: 'string', enum: ['scheduled','completed','canceled'] },
      notes:                { type: ['string', 'null'] },
      proposed_drop_off_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      proposed_pick_up_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      created_at:           { type: 'string', format: 'date-time' }
    },
    required: [
      'id','tenant_id','dog_id','drop_off_day','drop_off_block',
      'pick_up_day','pick_up_block','price','status','created_at'
    ]
  },
  CreateBoarding: {
    type: 'object',
    properties: {
      tenant_id:      { type: 'string', format: 'uuid' },
      dog_id:         { type: 'string', format: 'uuid' },
      drop_off_day:   { type: 'string', format: 'date' },
      drop_off_block: { type: 'string' },
      drop_off_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      pick_up_day:    { type: 'string', format: 'date' },
      pick_up_block:  { type: 'string' },
      pick_up_time:   { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      price:          { type: 'number' },
      notes:          { type: ['string', 'null'] },
      proposed_drop_off_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      proposed_pick_up_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' }
    },
    required: [
      'tenant_id','dog_id','drop_off_day','drop_off_block',
      'pick_up_day','pick_up_block','price'
    ]
  },
  UpdateBoarding: {
    type: 'object',
    properties: {
      drop_off_day:   { type: 'string', format: 'date' },
      drop_off_block: { type: 'string' },
      drop_off_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      pick_up_day:    { type: 'string', format: 'date' },
      pick_up_block:  { type: 'string' },
      pick_up_time:   { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      price:          { type: 'number' },
      status:         { type: 'string', enum: ['scheduled','completed','canceled'] },
      notes:          { type: ['string', 'null'] },
      proposed_drop_off_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      proposed_pick_up_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' }
    }
  }
};
