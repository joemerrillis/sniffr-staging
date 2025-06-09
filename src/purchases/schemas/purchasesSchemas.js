// src/purchases/schemas/purchasesSchemas.js

export const purchasesSchemas = {
  Purchase: {
    $id: 'Purchase',
    type: 'object',
    properties: {
      id:               { type: 'string', format: 'uuid' },
      tenant_id:        { type: 'string', format: 'uuid' },
      user_id:          { type: 'string', format: 'uuid' },
      type:             { 
        type: 'string',
        enum: ['walk', 'boarding', 'daycare', 'credit_pack', 'other'] // add types as needed
      },
      amount:           { type: 'number' },
      status:           { 
        type: 'string', 
        enum: ['pending', 'paid', 'failed', 'refunded', 'partial', 'canceled']
      },
      payment_method:   { type: 'string' }, // e.g., 'stripe', 'paypal', 'crypto'
      reference_id:     { type: ['string', 'null'] },
      cart: {
        type: 'array',
        description: 'Array of cart item objects, each from a pending_service (not just IDs)',
        items: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' }, // pending_service ID
            service_type:   { type: 'string' },
            service_date:   { type: 'string', format: 'date' },
            walk_window_id: { type: ['string', 'null'], format: 'uuid' },
            daycare_request_id:  { type: ['string', 'null'], format: 'uuid' },
            boarding_request_id: { type: ['string', 'null'], format: 'uuid' },
            dog_ids:        {
              type: 'array',
              items: { type: 'string', format: 'uuid' }
            },
            details:        { type: ['object', 'null'] },
            price_preview:  { $ref: 'PricePreview#' }
          },
          required: ['id', 'service_type', 'service_date']
        }
      },
      created_at:       { type: 'string', format: 'date-time' },
      paid_at:          { type: ['string', 'null'], format: 'date-time' },
      delegations:      { type: ['array', 'null'], items: { $ref: 'Delegation#' } },
      price_breakdown:  { $ref: 'PriceBreakdown#' },
      applied_discounts: { type: ['array', 'null'], items: { $ref: 'Discount#' } },
      deposit_amount:   { type: ['number', 'null'] },
      meta:             { type: ['object', 'null'] }
    },
    required: [
      'id', 'tenant_id', 'user_id', 'type', 'amount', 'status',
      'payment_method', 'cart', 'created_at'
    ]
  },

  PricePreview: {
    $id: 'PricePreview',
    type: 'object',
    properties: {
      price: { type: 'number' },
      breakdown: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            rule_type: { type: 'string' },
            description: { type: 'string' },
            adjustment: { type: 'number' },
            price_so_far: { type: 'number' }
          },
          required: ['id', 'name', 'rule_type', 'adjustment', 'price_so_far']
        }
      },
      error: { type: 'string' }
    }
  },

  PriceBreakdown: {
    $id: 'PriceBreakdown',
    type: 'object',
    properties: {
      price: { type: 'number' },
      breakdown: {
        type: 'array',
        items: { $ref: 'PricePreview#' }
      }
    }
  },

  Delegation: {
    $id: 'Delegation',
    type: 'object',
    properties: {
      walk_delegation_id: { type: 'string', format: 'uuid' },
      walk_window_id:     { type: 'string', format: 'uuid' },
      original_tenant_id: { type: 'string', format: 'uuid' },
      delegate_tenant_id: { type: 'string', format: 'uuid' },
      amount_due_to_delegate: { type: 'number' },
      status:             { type: 'string' },
      payout_status:      { type: 'string' }
    }
  },

  Discount: {
    $id: 'Discount',
    type: 'object',
    properties: {
      code:      { type: 'string' },
      type:      { type: 'string' },
      amount:    { type: 'number' },
      applied_to: { type: 'array', items: { type: 'string', format: 'uuid' } }
    }
  },

  CheckoutRequest: {
    type: 'object',
    properties: {
      cart:           { type: 'array', items: { type: 'string', format: 'uuid' } }, // pending_service IDs
      payment_method: { type: 'string', enum: ['stripe', 'paypal', 'crypto'] }
    },
    required: ['cart', 'payment_method']
  },

  CheckoutResponse: {
    type: 'object',
    properties: {
      purchase:   { $ref: 'Purchase#' },
      paymentUrl: { type: 'string' }
    }
  },

  WebhookPayload: {
    type: 'object',
    additionalProperties: true // Accept any payload (handled per provider)
  }
};
