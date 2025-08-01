// schemas/stripeConnectSchemas.js

export const stripeConnectSchemas = {
  StripeConnectStartResponse: {
    $id: 'StripeConnectStartResponse',
    type: 'object',
    properties: {
      url: { type: 'string' }
    },
    required: ['url']
  },
  StripeConnectCallbackResponse: {
    $id: 'StripeConnectCallbackResponse',
    type: 'object',
    properties: {
      success: { type: 'boolean' }
    },
    required: ['success']
  }
};
