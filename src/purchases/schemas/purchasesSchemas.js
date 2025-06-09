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
        enum: ['walk', 'boarding', 'daycare', 'credit_pack', 'other']
      },
      amount:           { type: 'number' },
      status:           { 
        type: 'string', 
        enum: ['pending', 'paid', 'failed', 'refunded', 'partial', 'canceled']
      },
      payment_method:   { type: 'string' },
      reference_id:     { type: ['string', 'null'] },
      cart: {
        type: 'array',
        description: 'Array of cart item objects, each from a pending_service (not just IDs)',
        items: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
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
      'payment_method', 'created_at'
      // 'cart',  <-- removed from required to match actual usage!
    ]
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
    $id: 'CheckoutRequest',
    type: 'object',
    properties: {
      cart:           { type: 'array', items: { type: 'string', format: 'uuid' } },
      payment_method: { type: 'string', enum: ['stripe', 'paypal', 'crypto'] }
    },
    required: ['cart', 'payment_method']
  },

  CheckoutResponse: {
    $id: 'CheckoutResponse',
    type: 'object',
    oneOf: [
      // Single purchase response
      {
        type: 'object',
        properties: {
          purchase:   { $ref: 'Purchase#' },
          cart: {
            type: 'array',
            items: { type: 'object' }
          },
          price_breakdown: { $ref: 'PriceBreakdown#' },
          paymentUrl: { type: ['string', 'null'] }
        },
        required: ['purchase', 'cart', 'price_breakdown']
      },
      // Multi-purchase response
      {
        type: 'object',
        properties: {
          purchases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                purchase:   { $ref: 'Purchase#' },
                cart: {
                  type: 'array',
                  items: { type: 'object' }
                },
                price_breakdown: { $ref: 'PriceBreakdown#' },
                paymentUrl: { type: ['string', 'null'] }
              },
              required: ['purchase', 'cart', 'price_breakdown']
            }
          }
        },
        required: ['purchases']
      }
    ]
  },

  WebhookPayload: {
    $id: 'WebhookPayload',
    type: 'object',
    additionalProperties: true
  }
};
