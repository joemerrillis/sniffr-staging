export const tenantSchemas = {
  Tenant: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      slug: { type: 'string' },
      custom_domain: { type: ['string', 'null'] },
      logo_url: { type: ['string', 'null'] },
      primary_color: { type: ['string', 'null'] },
      subscription_tier: { type: 'string', enum: ['free', 'basic', 'pro', 'enterprise'] },
      stripe_customer_id: { type: ['string', 'null'] },
      gusto_token: { type: ['string', 'null'] },
      use_time_blocks: { type: 'boolean' },
      time_blocks_config: { type: ['object', 'null'] },
      features: { type: 'object' },
      created_at: { type: 'string', format: 'date-time' },
      // New fields for window population config:
      window_populate_frequency: { type: ['string', 'null'], description: 'daily, weekly, monthly, etc.' },
      window_populate_day: { type: ['integer', 'null'], description: '0=Sunday, 1=Monday, etc.' },
      window_lead_time_days: { type: ['integer', 'null'], description: 'Days ahead to fill' },
      window_populate_time: { type: ['string', 'null'], description: 'Time of day (HH:MM:SS)' }
    },
    required: [
      'id', 'name', 'slug', 'subscription_tier', 'use_time_blocks', 'features', 'created_at'
    ]
  },
  CreateTenant: {
    type: 'object',
    required: ['name', 'slug'],
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      custom_domain: { type: 'string' },
      logo_url: { type: 'string' },
      primary_color: { type: 'string' },
      subscription_tier: { type: 'string', enum: ['free', 'basic', 'pro', 'enterprise'] },
      stripe_customer_id: { type: 'string' },
      gusto_token: { type: 'string' },
      use_time_blocks: { type: 'boolean' },
      time_blocks_config: { type: 'object' },
      features: { type: ['object', 'null'] },
      // New fields:
      window_populate_frequency: { type: 'string', description: 'daily, weekly, monthly, etc.' },
      window_populate_day: { type: 'integer', description: '0=Sunday, 1=Monday, etc.' },
      window_lead_time_days: { type: 'integer', description: 'Days ahead to fill' },
      window_populate_time: { type: 'string', description: 'Time of day (HH:MM:SS)' }
    }
  },
  UpdateTenant: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      custom_domain: { type: 'string' },
      logo_url: { type: 'string' },
      primary_color: { type: 'string' },
      subscription_tier: { type: 'string', enum: ['free', 'basic', 'pro', 'enterprise'] },
      stripe_customer_id: { type: 'string' },
      gusto_token: { type: 'string' },
      use_time_blocks: { type: 'boolean' },
      time_blocks_config: { type: 'object' },
      features: { type: ['object', 'null'] },
      // New fields:
      window_populate_frequency: { type: 'string', description: 'daily, weekly, monthly, etc.' },
      window_populate_day: { type: 'integer', description: '0=Sunday, 1=Monday, etc.' },
      window_lead_time_days: { type: 'integer', description: 'Days ahead to fill' },
      window_populate_time: { type: 'string', description: 'Time of day (HH:MM:SS)' }
    }
  }
};
