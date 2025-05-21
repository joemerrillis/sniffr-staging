// src/purchases/schemas/purchasesSchemas.js
export const purchasesSchemas = {
  Purchase: {
    $id: 'Purchase',
    type: 'object',
    properties: {
      id:             { type: 'string', format: 'uuid' },
      tenant_id:      { type: 'string', format: 'uuid' },
      user_id:        { type: 'string', format: 'uuid' },
      type:           { type: 'string', enum: ['walk', 'boarding', 'daycare', 'credit_pack'] },
      amount:         { type: 'number' },
      status:         { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'] },
      payment_method: { type: 'string' }, // e.g., 'stripe', 'paypal', 'crypto'
      reference_id:   { type: ['string', 'null'] },
      cart:           { type: 'array', items: { type: 'string' } }, // pending_service IDs
      created_at:     { type: 'string', format: 'date-time' },
      paid_at:        { type: ['string', 'null'], format: 'date-time' }
    },
    required: [
      'id','tenant_id','user_id','type','amount','status',
      'payment_method','cart','created_at'
    ]
  },
  CheckoutRequest: {
    type: 'object',
    properties: {
      cart:           { type: 'array', items: { type: 'string', format: 'uuid' } }, // pending_service IDs
      payment_method: { type: 'string', enum: ['stripe', 'paypal', 'crypto'] }
    },
    required: ['cart','payment_method']
  },
  CheckoutResponse: {
    type: 'object',
    properties: {
      purchase:   { $ref: 'Purchase#' },
      paymentUrl: { type: 'string' } // URL to redirect user
    }
  },
  WebhookPayload: {
    type: 'object',
    additionalProperties: true // Accept any payload (handled per provider)
  }
};
