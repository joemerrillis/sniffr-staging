// src/boardings/schemas/boardingsSchemas.js

export const boardingSchemas = {
  Boarding: {
    $id: 'Boarding',
    type: 'object',
    properties: {
      id:                   { type: 'string', format: 'uuid' },
      tenant_id:            { type: 'string', format: 'uuid' },
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
      created_at:           { type: 'string', format: 'date-time' },

      // --- Additional fields below ---
      proposed_changes:     { type: ['object', 'null'] },
      user_id:              { type: 'string', format: 'uuid' },
      is_draft:             { type: ['boolean', 'null'] },
      approved_by:          { type: ['string', 'null'], format: 'uuid' },
      approved_at:          { type: ['string', 'null'], format: 'date-time' },
      booking_id:           { type: ['string', 'null'], format: 'uuid' },
      final_price:          { type: ['number', 'null'] }
    },
    required: [
      'id','tenant_id','drop_off_day','drop_off_block',
      'pick_up_day','pick_up_block','price','status','created_at','user_id'
    ]
  },
  CreateBoarding: {
    $id: 'CreateBoarding',
    type: 'object',
    properties: {
      tenant_id:      { type: 'string', format: 'uuid' },
      drop_off_day:   { type: 'string', format: 'date' },
      drop_off_block: { type: 'string' },
      drop_off_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      pick_up_day:    { type: 'string', format: 'date' },
      pick_up_block:  { type: 'string' },
      pick_up_time:   { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      price:          { type: 'number' },
      notes:          { type: ['string', 'null'] },
      proposed_drop_off_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      proposed_pick_up_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      proposed_changes:     { type: ['object', 'null'] },
      booking_id:           { type: ['string', 'null'], format: 'uuid' },
      is_draft:             { type: ['boolean', 'null'] },
      final_price:          { type: ['number', 'null'] }
    },
    required: [
      'tenant_id','drop_off_day','drop_off_block',
      'pick_up_day','pick_up_block','price'
    ]
  },
  UpdateBoarding: {
    $id: 'UpdateBoarding',
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
      proposed_pick_up_time:  { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
      proposed_changes:     { type: ['object', 'null'] },
      booking_id:           { type: ['string', 'null'], format: 'uuid' },
      is_draft:             { type: ['boolean', 'null'] },
      approved_by:          { type: ['string', 'null'], format: 'uuid' },
      approved_at:          { type: ['string', 'null'], format: 'date-time' },
      final_price:          { type: ['number', 'null'] }
    }
  }
};
