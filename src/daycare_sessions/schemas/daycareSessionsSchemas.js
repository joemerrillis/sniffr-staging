export const daycareSessionSchemas = {
  DaycareSession: {
    $id: 'DaycareSession',
    type: 'object',
    properties: {
      id:                  { type: 'string', format: 'uuid' },
      tenant_id:           { type: 'string', format: 'uuid' },
      dog_id:              { type: 'string', format: 'uuid' },
      package_id:          { type: ['string', 'null'], format: 'uuid' },
      dropoff_time:        { type: 'string', format: 'date-time' },
      expected_pickup_time:{ type: 'string', format: 'date-time' },
      pickup_time:         { type: ['string', 'null'], format: 'date-time' },
      penalty_amount:      { type: 'number' },
      notes:               { type: ['string', 'null'] },
      proposed_dropoff_time:{ type: ['string', 'null'], format: 'date-time' },
      proposed_pickup_time: { type: ['string', 'null'], format: 'date-time' },
      proposed_changes:    { type: ['object', 'null'] },
      created_at:          { type: 'string', format: 'date-time' }
    },
    required: [
      'id','tenant_id','dog_id','dropoff_time','expected_pickup_time','penalty_amount','created_at'
    ]
  },
  CreateDaycareSession: {
    type: 'object',
    properties: {
      tenant_id:            { type: 'string', format: 'uuid' },
      dog_id:               { type: 'string', format: 'uuid' },
      package_id:           { type: ['string', 'null'], format: 'uuid' },
      dropoff_time:         { type: 'string', format: 'date-time' },
      expected_pickup_time: { type: 'string', format: 'date-time' },
      notes:                { type: ['string', 'null'] },
      proposed_dropoff_time:{ type: ['string', 'null'], format: 'date-time' },
      proposed_pickup_time: { type: ['string', 'null'], format: 'date-time' },
      proposed_changes:     { type: ['object', 'null'] }
    },
    required: ['tenant_id','dog_id','dropoff_time','expected_pickup_time']
  },
  UpdateDaycareSession: {
    type: 'object',
    properties: {
      package_id:            { type: ['string', 'null'], format: 'uuid' },
      dropoff_time:          { type: 'string', format: 'date-time' },
      expected_pickup_time:  { type: 'string', format: 'date-time' },
      pickup_time:           { type: ['string', 'null'], format: 'date-time' },
      penalty_amount:        { type: 'number' },
      notes:                 { type: ['string', 'null'] },
      proposed_dropoff_time: { type: ['string', 'null'], format: 'date-time' },
      proposed_pickup_time:  { type: ['string', 'null'], format: 'date-time' },
      proposed_changes:      { type: ['object', 'null'] }
    }
    // all fields optional
  }
};
