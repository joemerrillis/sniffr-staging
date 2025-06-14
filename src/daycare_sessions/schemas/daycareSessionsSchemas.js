export const daycareSessionSchemas = {
  DaycareSession: {
    $id: 'DaycareSession',
    type: 'object',
    properties: {
      id:                  { type: 'string', format: 'uuid' },
      tenant_id:           { type: 'string', format: 'uuid' },
      dog_ids: {           // <-- Use array for parity with boardings/walks
        type: 'array',
        items: { type: 'string', format: 'uuid' }
      },
      package_id:          { type: ['string', 'null'], format: 'uuid' },
      dropoff_time:        { type: 'string', format: 'date-time' },
      expected_pickup_time:{ type: 'string', format: 'date-time' },
      pickup_time:         { type: ['string', 'null'], format: 'date-time' },
      penalty_amount:      { type: 'number' },
      notes:               { type: ['string', 'null'] },
      proposed_dropoff_time:{ type: ['string', 'null'], format: 'date-time' },
      proposed_pickup_time: { type: ['string', 'null'], format: 'date-time' },
      proposed_changes:    { type: ['object', 'null'] },
      created_at:          { type: 'string', format: 'date-time' },
      price:               { type: 'number' },      // New
      status:              { type: 'string' },      // New: 'pending_approval', 'approved'
    },
    required: [
      'id','tenant_id','dog_ids','dropoff_time','expected_pickup_time','penalty_amount','created_at','price','status'
    ]
  },

  CreateDaycareSession: {
    $id: 'CreateDaycareSession',
    type: 'object',
    properties: {
      tenant_id:            { type: 'string', format: 'uuid' },
      dog_ids: {            // <-- Array, not single dog_id
        type: 'array',
        items: { type: 'string', format: 'uuid' }
      },
      package_id:           { type: ['string', 'null'], format: 'uuid' },
      dropoff_time:         { type: 'string', format: 'date-time' },
      expected_pickup_time: { type: 'string', format: 'date-time' },
      notes:                { type: ['string', 'null'] },
      proposed_dropoff_time:{ type: ['string', 'null'], format: 'date-time' },
      proposed_pickup_time: { type: ['string', 'null'], format: 'date-time' },
      proposed_changes:     { type: ['object', 'null'] }
    },
    required: ['tenant_id','dog_ids','dropoff_time','expected_pickup_time']
  },

  UpdateDaycareSession: {
    $id: 'UpdateDaycareSession',
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
  },

  // --- Envelope and Response Objects ---
  DaycareSessionEnvelope: {
    $id: 'DaycareSessionEnvelope',
    type: 'object',
    properties: {
      daycare_session: { $ref: 'DaycareSession#' },
      pending_service: { type: ['object', 'null'] }, // see: PendingService#
      breakdown: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            rule_type: { type: 'string' },
            description: { type: 'string' },
            adjustment: { type: 'number' },
            price_so_far: { type: 'number' }
          },
          required: ['id','name','rule_type','description','adjustment','price_so_far']
        }
      },
      requiresApproval: { type: 'boolean' }
    },
    required: ['daycare_session']
  },

  // ...You can also add a DaycareSessionsEnvelope (for lists) if needed...
};

