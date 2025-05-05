export const friendSchemas = {
  Friend: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      dog_id: { type: 'string', format: 'uuid' },
      friend_dog_id: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: ['requested','accepted','blocked'] },
      created_at: { type: 'string', format: 'date-time' }
    },
    required: ['id','dog_id','friend_dog_id','status','created_at']
  },
  CreateFriend: {
    type: 'object',
    properties: {
      dog_id: { type: 'string', format: 'uuid' },
      friend_dog_id: { type: 'string', format: 'uuid' }
    },
    required: ['dog_id','friend_dog_id']
  },
  UpdateFriend: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['requested','accepted','blocked'] }
    },
    required: ['status']
  }
};
