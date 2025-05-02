export const dogVisibilitySchemas = {
  Visibility: {
    type: 'object',
    properties: {
      dog_id: { type: 'string', format: 'uuid' },
      is_visible: { type: 'boolean' }
    },
    required: ['dog_id', 'is_visible']
  },
  UpdateVisibility: {
    type: 'object',
    properties: {
      is_visible: { type: 'boolean' }
    },
    required: ['is_visible']
  }
};