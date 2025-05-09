export const TenantClient = {
  type: 'object',
  properties: {
    id:          { type: 'string', format: 'uuid' },
    tenant_id:   { type: 'string', format: 'uuid' },
    client_id:   { type: 'string', format: 'uuid' },
    met_at:      { type: 'string', format: 'date-time' },
    accepted:    { type: 'boolean' },
    accepted_at:{ type: ['string', 'null'], format: 'date-time' }
  }
};

export const CreateTenantClient = {
  type: 'object',
  properties: {
    tenant_id:   { type: 'string', format: 'uuid' },
    client_id:   { type: 'string', format: 'uuid' },
    met_at:      { type: 'string', format: 'date-time' },
    accepted:    { type: 'boolean' },
    accepted_at:{ type: 'string', format: 'date-time' }
  },
  required: ['tenant_id', 'client_id']
};

export const UpdateTenantClient = {
  type: 'object',
  properties: {
    tenant_id:   { type: 'string', format: 'uuid' },
    client_id:   { type: 'string', format: 'uuid' },
    met_at:      { type: 'string', format: 'date-time' },
    accepted:    { type: 'boolean' },
    accepted_at:{ type: 'string', format: 'date-time' }
  }
};
