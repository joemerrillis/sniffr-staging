// src/purchases/schemas/delegationSchemas.js

export const Delegation = {
  $id: 'Delegation',
  type: 'object',
  properties: {
    id:             { type: 'string', format: 'uuid' },
    // Add more fields here as needed!
  },
  required: ['id']
};
