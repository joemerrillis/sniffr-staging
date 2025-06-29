export const DaycareSession = {
  $id: 'DaycareSession',
  type: 'object',
  properties: {
    id:                  { type: 'string', format: 'uuid' },
    tenant_id:           { type: 'string', format: 'uuid' },
    user_id:             { type: 'string', format: 'uuid' },
    dog_ids: {           // <-- ADDED
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    },
    service_date:        { type: 'string', format: 'date' },
    drop_off_time:       { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    expected_pick_up_time:{ type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    pick_up_time:        { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    notes:               { type: ['string', 'null'] },
    penalty_amount:      { type: ['number', 'null'] },
    created_at:          { type: 'string', format: 'date-time' },
    proposed_service_date: { type: ['string', 'null'], format: 'date' },
    proposed_drop_off_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    proposed_pick_up_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    proposed_changes:    { type: ['object', 'null'] }
  },
  required: [
    'id', 'tenant_id', 'user_id', 'service_date',
    'drop_off_time', 'expected_pick_up_time', 'created_at'
  ]
};

export const CreateDaycareSession = {
  $id: 'CreateDaycareSession',
  type: 'object',
  properties: {
    tenant_id:           { type: 'string', format: 'uuid' },
    user_id:             { type: 'string', format: 'uuid' },
    dog_ids: {           // <-- ADDED
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    },
    service_date:        { type: 'string', format: 'date' },
    drop_off_time:       { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    expected_pick_up_time:{ type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    notes:               { type: ['string', 'null'] },
    proposed_service_date: { type: ['string', 'null'], format: 'date' },
    proposed_drop_off_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    proposed_pick_up_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    proposed_changes:    { type: ['object', 'null'] }
  },
  required: [
    'tenant_id', 'user_id', 'service_date',
    'drop_off_time', 'expected_pick_up_time'
  ]
};

export const UpdateDaycareSession = {
  $id: 'UpdateDaycareSession',
  type: 'object',
  properties: {
    dog_ids: {           // <-- ADDED
      type: 'array',
      items: { type: 'string', format: 'uuid' }
    },
    drop_off_time:         { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    expected_pick_up_time: { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    pick_up_time:          { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    penalty_amount:        { type: ['number', 'null'] },
    notes:                 { type: ['string', 'null'] },
    proposed_service_date: { type: ['string', 'null'], format: 'date' },
    proposed_drop_off_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    proposed_pick_up_time: { type: ['string', 'null'], pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' },
    proposed_changes:      { type: ['object', 'null'] }
    // All fields optional for PATCH!
  }
};
