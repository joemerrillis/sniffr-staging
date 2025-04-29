export const domainSchemas = {
  Domain: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenant_id: { type: 'string', format: 'uuid' },
      domain: { type: 'string' },
      verified: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'tenant_id', 'domain', 'verified', 'created_at']
  },
  CreateDomain: {
    type: 'object',
    required: ['tenant_id', 'domain'],
    properties: {
      tenant_id: { type: 'string', format: 'uuid' },
      domain: { type: 'string' }
    }
  },
  UpdateDomain: {
    type: 'object',
    properties: {
      domain: { type: 'string' },
      verified: { type: 'boolean' }
    }
  }
};