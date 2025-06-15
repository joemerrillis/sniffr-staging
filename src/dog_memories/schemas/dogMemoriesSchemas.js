// src/dog_memories/schemas/dogMemoriesSchemas.js

export const dogMemoriesSchemas = {
  DogMemory: {
    $id: 'DogMemory',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      uploader_id: { type: 'string', format: 'uuid', description: 'User who created/uploaded the memory.' },
      dog_ids: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        minItems: 1,
        description: 'All dogs featured in the memory.'
      },
      human_ids: {
        type: 'array',
        items: { type: 'string', format: 'uuid' },
        description: 'Other users tagged (owners, walkers, etc).'
      },
      image_url: { type: 'string', format: 'uri', description: 'Main image file (R2 URL).' },
      video_url: { type: 'string', format: 'uri', nullable: true, description: 'Optional video file.' },
      caption: { type: 'string', description: 'User or AI-generated caption.' },
      ai_caption: { type: 'string', nullable: true, description: 'Optional AI-suggested caption.' },
      transcript: { type: 'string', nullable: true, description: 'Transcript from audio/video, or walk notes.' },
      event_type: {
        type: 'string',
        enum: ['walk', 'boarding', 'daycare', 'park', 'manual'],
        description: 'Source/context for memory.'
      },
      event_id: { type: 'string', format: 'uuid', nullable: true, description: 'Link to service event (walk, boarding, etc).' },
      location_id: { type: 'string', format: 'uuid', nullable: true, description: 'Park, place, or geofence.' },
      privacy: {
        type: 'string',
        enum: ['private', 'friends', 'public'],
        default: 'private',
        description: 'Visibility setting.'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Descriptive tags or keywords.'
      },
      created_at: { type: 'string', format: 'date-time', description: 'ISO timestamp.' }
    },
    required: [
      'id',
      'uploader_id',
      'dog_ids',
      'image_url',
      'caption',
      'event_type',
      'created_at'
    ]
  },

  CreateDogMemory: {
    $id: 'CreateDogMemory',
    type: 'object',
    properties: {
      dog_ids: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 },
      human_ids: { type: 'array', items: { type: 'string', format: 'uuid' } },
      image_url: { type: 'string', format: 'uri' },
      video_url: { type: 'string', format: 'uri', nullable: true },
      caption: { type: 'string' },
      event_type: { type: 'string', enum: ['walk', 'boarding', 'daycare', 'park', 'manual'] },
      event_id: { type: 'string', format: 'uuid', nullable: true },
      location_id: { type: 'string', format: 'uuid', nullable: true },
      privacy: { type: 'string', enum: ['private', 'friends', 'public'], default: 'private' },
      tags: { type: 'array', items: { type: 'string' } }
    },
    required: [
      'dog_ids',
      'image_url',
      'caption',
      'event_type'
    ]
  },

  UpdateDogMemory: {
    $id: 'UpdateDogMemory',
    type: 'object',
    properties: {
      caption: { type: 'string' },
      privacy: { type: 'string', enum: ['private', 'friends', 'public'] },
      tags: { type: 'array', items: { type: 'string' } }
    }
    // All optional fields
  }
};
