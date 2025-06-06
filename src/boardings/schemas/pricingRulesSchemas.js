// src/boardings/schemas/pricingRulesSchemas.js

export const PricingRule = {
  $id: 'PricingRule',
  type: 'object',
  properties: {
    id:                   { type: 'string', format: 'uuid' },
    tenant_id:            { type: 'string', format: 'uuid' },
    name:                 { type: 'string' },
    priority:             { type: 'integer' },
    rule_type:            { type: 'string' }, // base, multi-dog, etc
    rule_data:            { type: 'object' }, // flexible (see examples)
    price_adjustment_type:{ type: 'string', enum: ['flat', 'percent'] },
    price_adjustment_value:{ type: 'number' },
    enabled:              { type: 'boolean' },
    description:          { type: ['string', 'null'] },
    created_at:           { type: 'string', format: 'date-time' },
    updated_at:           { type: 'string', format: 'date-time' }
  },
  required: [
    'id', 'tenant_id', 'name', 'priority',
    'rule_type', 'price_adjustment_type', 'price_adjustment_value', 'enabled'
  ]
};

export const PricingRuleList = {
  $id: 'PricingRuleList',
  type: 'object',
  properties: {
    rules: {
      type: 'array',
      items: { $ref: 'PricingRule' }
    }
  },
  required: ['rules']
};

export const CreatePricingRule = {
  $id: 'CreatePricingRule',
  type: 'object',
  properties: {
    tenant_id:             { type: 'string', format: 'uuid' },
    name:                  { type: 'string' },
    priority:              { type: 'integer' },
    rule_type:             { type: 'string' },
    rule_data:             { type: 'object' },
    price_adjustment_type: { type: 'string', enum: ['flat', 'percent'] },
    price_adjustment_value:{ type: 'number' },
    enabled:               { type: 'boolean' },
    description:           { type: ['string', 'null'] }
  },
  required: [
    'tenant_id', 'name', 'rule_type', 'price_adjustment_type', 'price_adjustment_value'
  ]
};

export const UpdatePricingRule = {
  $id: 'UpdatePricingRule',
  type: 'object',
  properties: {
    name:                  { type: 'string' },
    priority:              { type: 'integer' },
    rule_type:             { type: 'string' },
    rule_data:             { type: 'object' },
    price_adjustment_type: { type: 'string', enum: ['flat', 'percent'] },
    price_adjustment_value:{ type: 'number' },
    enabled:               { type: 'boolean' },
    description:           { type: ['string', 'null'] }
  }
};
