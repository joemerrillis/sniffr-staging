export const dogSchemas = {
  Dog: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      photo_url: { type: ['string', 'null'], format: 'uri' },
      birthdate: { type: ['string', 'null'], format: 'date' },
      universal_profile_id: { type: ['string', 'null'], format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' }
      // tenant_id and owner_id REMOVED
    },
    required: ['id', 'name', 'created_at'] // Only what is truly required in dogs table
  },
  CreateDog: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      birthdate: { type: 'string', format: 'date' },
      universal_profile_id: { type: 'string', format: 'uuid' }
      // tenant_id and owner_id REMOVED
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
