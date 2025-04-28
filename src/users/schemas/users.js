export const userSchemas = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenant_id: { type: ['string', 'null'], format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['platform_admin','tenant_admin','walker','client'] },
      created_at: { type: 'string', format: 'date-time' }
    },
    required: ['id','email','name','role','created_at']
  },
  CreateUser: {
    type: 'object',
    required: ['email','name','password','role'],
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      password: { type: 'string', minLength: 8 },
      role: { type: 'string', enum: ['tenant_admin','walker','client'] }
    }
  },
  UpdateUser: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      role: { type: 'string', enum: ['platform_admin','tenant_admin','walker','client'] },
      calendar_pref: { type: 'string', enum: ['google','outlook','none'] }
    }
  }
};