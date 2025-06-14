export const DaycareSession = {
  $id: 'DaycareSession',
  type: 'object',
  properties: {
    id:                  { type: 'string', format: 'uuid' },
    tenant_id:           { type: 'string', format: 'uuid' },
    user_id:             { type: 'string', format: 'uuid' },
    service_date:        { type: 'string', format: 'date' },      // e.g. "2025-06-14"
    drop_off_time:       { type: 'string', pattern: '^([0-1]?\\d|2[0-3]):([0-5]\\d)$' }, // "09:00"
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

// Optionally, you can export as a bundle:
export const daycareSessionSchemas = {
  DaycareSession,
  CreateDaycareSession,
  UpdateDaycareSession
};


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

