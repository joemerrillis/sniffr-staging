export const pricingRuleSchemas = {
  PricingRule: {
    $id: 'PricingRule',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenant_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      priority: { type: 'integer' },
      rule_type: { type: 'string' },
      rule_data: { type: 'object' },
      price_adjustment_type: { type: 'string', enum: ['fixed', 'percent', 'override'] },
      price_adjustment_value: { type: 'number' },
      enabled: { type: 'boolean' },
      description: { type: ['string', 'null'] },
      created_at: { type: 'string', format: 'date-time' }
    },
    required: [
      'id', 'tenant_id', 'name', 'rule_type', 'price_adjustment_type', 'price_adjustment_value'
    ]
  },
  CreatePricingRule: {
    $id: 'CreatePricingRule',
    type: 'object',
    properties: {
      tenant_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      priority: { type: 'integer' },
      rule_type: { type: 'string' },
      rule_data: { type: 'object' },
      price_adjustment_type: { type: 'string', enum: ['fixed', 'percent', 'override'] },
      price_adjustment_value: { type: 'number' },
      enabled: { type: 'boolean' },
      description: { type: ['string', 'null'] }
    },
    required: [
      'tenant_id', 'name', 'rule_type', 'price_adjustment_type', 'price_adjustment_value'
    ]
  }
};
