export const Employee = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenant_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    is_primary: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' }
  }
};

export const CreateEmployee = {
  type: 'object',
  properties: {
    tenant_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    is_primary: { type: 'boolean' }
  },
  required: ['tenant_id', 'user_id']
};

export const UpdateEmployee = {
  type: 'object',
  properties: {
    tenant_id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    is_primary: { type: 'boolean' }
  }
};
