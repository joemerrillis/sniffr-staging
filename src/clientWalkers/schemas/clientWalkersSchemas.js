export const ClientWalker = {
  type: 'object',
  properties: {
    id:          { type: 'string', format: 'uuid' },
    client_id:   { type: 'string', format: 'uuid' },
    employee_id: { type: 'string', format: 'uuid' },
    met_at:      { type: 'string', format: 'date-time' }
  }
};

export const CreateClientWalker = {
  type: 'object',
  properties: {
    client_id:   { type: 'string', format: 'uuid' },
    employee_id: { type: 'string', format: 'uuid' },
    met_at:      { type: 'string', format: 'date-time' }
  },
  required: ['client_id', 'employee_id']
};

export const UpdateClientWalker = {
  type: 'object',
  properties: {
    client_id:   { type: 'string', format: 'uuid' },
    employee_id: { type: 'string', format: 'uuid' },
    met_at:      { type: 'string', format: 'date-time' }
  }
};
