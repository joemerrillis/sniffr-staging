export const dogSchemas = {
  Dog: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenant_id: { type: ['string', 'null'], format: 'uuid' },
      owner_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      photo_url: { type: ['string', 'null'], format: 'uri' },
      birthdate: { type: ['string', 'null'], format: 'date' },
      universal_profile_id: { type: ['string', 'null'], format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' }
    },
    required: ['id','owner_id','name','created_at']
  },
  CreateDog: {
    type: 'object',
    required: ['owner_id','name'],
    properties: {
      tenant_id: { type: 'string', format: 'uuid' },
      owner_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      birthdate: { type: 'string', format: 'date' },
      universal_profile_id: { type: 'string', format: 'uuid' }
    }
  },
  UpdateDog: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      photo_url: { type: 'string', format: 'uri' },
      birthdate: { type: 'string', format: 'date' },
      universal_profile_id: { type: 'string', format: 'uuid' }
    }
  }
};