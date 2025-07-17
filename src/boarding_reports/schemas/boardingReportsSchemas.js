// src/boarding_reports/schemas/boardingReportsSchemas.js

export const boardingReportsSchemas = {
  BoardingReport: {
    $id: 'BoardingReport',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      boarding_id: { type: 'string', format: 'uuid' },
      dog_id: { type: 'string', format: 'uuid' },
      start_time: { type: ['string', 'null'], format: 'date-time' },
      end_time: { type: ['string', 'null'], format: 'date-time' },
      summary: { type: ['string', 'null'] },
      tasks: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            label: { type: 'string' },
            completed: { type: 'boolean' },
            completed_at: { type: ['string', 'null'], format: 'date-time' },
            completed_by: { type: ['string', 'null'], format: 'uuid' }
          },
          required: ['key', 'label', 'completed']
        }
      },
      photos: {
        type: ['array', 'null'],
        description: 'References to dog_memories records with matching meta',
        items: {
          type: 'object',
          properties: {
            dog_memory_id: { type: 'string', format: 'uuid' },
            image_url: { type: 'string', format: 'uri' },
            caption: { type: ['string', 'null'] },
            meta: { type: 'object' }
          },
          required: ['dog_memory_id', 'image_url']
        }
      },
      instructions_img_url: { type: ['string', 'null'], format: 'uri' },
      notes: { type: ['string', 'null'] },
      ai_story_json: { type: ['object', 'null'] },
      transcript: { type: ['string', 'null'] },
      created_at: { type: ['string', 'null'], format: 'date-time' },
      updated_at: { type: ['string', 'null'], format: 'date-time' },
      status: { type: ['string', 'null'], enum: ['draft', 'active', 'finalized', 'archived'] },
      user_id: { type: ['string', 'null'], format: 'uuid' },
      staff_ids: {
        type: ['array', 'null'],
        items: { type: 'string', format: 'uuid' }
      },
      visibility: { type: ['string', 'null'], enum: ['private', 'client', 'staff', 'public'] }
    },
    required: [
      'id',
      'boarding_id',
      'dog_id',
      'status',
      'created_at'
    ],
    additionalProperties: false
  },

  BoardingReportEnvelope: {
    $id: 'BoardingReportEnvelope',
    type: 'object',
    properties: {
      boarding_report: { $ref: 'BoardingReport#' }
    },
    required: ['boarding_report'],
    additionalProperties: false
  },

  BoardingReportsEnvelope: {
    $id: 'BoardingReportsEnvelope',
    type: 'object',
    properties: {
      boarding_reports: {
        type: 'array',
        items: { $ref: 'BoardingReport#' }
      }
    },
    required: ['boarding_reports'],
    additionalProperties: false
  },

  BoardingReportListQuery: {
    $id: 'BoardingReportListQuery',
    type: 'object',
    properties: {
      dog_id: { type: 'string', format: 'uuid' },
      boarding_id: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: ['draft', 'active', 'finalized', 'archived'] },
      start_date: { type: 'string', format: 'date' },
      end_date: { type: 'string', format: 'date' },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      offset: { type: 'integer', minimum: 0 }
    },
    additionalProperties: false
  },

  BoardingReportIdParam: {
    $id: 'BoardingReportIdParam',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' }
    },
    required: ['id'],
    additionalProperties: false
  },

  CreateBoardingReportBody: {
    $id: 'CreateBoardingReportBody',
    type: 'object',
    properties: {
      boarding_id: { type: 'string', format: 'uuid' },
      dog_id: { type: 'string', format: 'uuid' },
      start_time: { type: ['string', 'null'], format: 'date-time' },
      end_time: { type: ['string', 'null'], format: 'date-time' },
      user_id: { type: 'string', format: 'uuid' },
      instructions_img_url: { type: ['string', 'null'], format: 'uri' },
      notes: { type: ['string', 'null'] },
      status: { type: ['string', 'null'] },
      visibility: {type: ['string', 'null'] }
    },
    required: ['boarding_id', 'dog_id', 'user_id', 'status', 'visibility'],
    additionalProperties: false
  },

  UpdateBoardingReportBody: {
    $id: 'UpdateBoardingReportBody',
    type: 'object',
    properties: {
      summary: { type: ['string', 'null'] },
      notes: { type: ['string', 'null'] },
      status: { type: 'string', enum: ['draft', 'active', 'finalized', 'archived'] },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            label: { type: 'string' },
            completed: { type: 'boolean' },
            completed_at: { type: ['string', 'null'], format: 'date-time' },
            completed_by: { type: ['string', 'null'], format: 'uuid' }
          },
          required: ['key', 'label', 'completed']
        }
      },
      photos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dog_memory_id: { type: 'string', format: 'uuid' },
            image_url: { type: 'string', format: 'uri' },
            caption: { type: ['string', 'null'] },
            meta: { type: 'object' }
          },
          required: ['dog_memory_id', 'image_url']
        }
      },
      ai_story_json: { type: ['object', 'null'] },
      transcript: { type: ['string', 'null'] },
      staff_ids: {
        type: 'array',
        items: { type: 'string', format: 'uuid' }
      },
      visibility: { type: ['string', 'null'], enum: ['private', 'client', 'staff', 'public'] }
    },
    additionalProperties: false
  },

  DeleteResultEnvelope: {
    $id: 'DeleteResultEnvelope',
    type: 'object',
    properties: {
      success: { type: 'boolean' }
    },
    required: ['success'],
    additionalProperties: false
  },

  CompleteTaskBody: {
    $id: 'CompleteTaskBody',
    type: 'object',
    properties: {
      task_key: { type: 'string' },
      completed_by: { type: 'string', format: 'uuid' },
      timestamp: { type: ['string', 'null'], format: 'date-time' }
    },
    required: ['task_key', 'completed_by'],
    additionalProperties: false
  },

  PushToClientBody: {
    $id: 'PushToClientBody',
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['final_summary', 'new_photo', 'custom'] },
      message: { type: ['string', 'null'] }
    },
    required: ['type'],
    additionalProperties: false
  },

  PushToClientResultEnvelope: {
    $id: 'PushToClientResultEnvelope',
    type: 'object',
    properties: {
      success: { type: 'boolean' }
    },
    required: ['success'],
    additionalProperties: false
  },

  Chat: {
    $id: 'Chat',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      tenant_id: { type: ['string', 'null'], format: 'uuid' },
      chat_type: { type: 'string' },
      household_id: { type: ['string', 'null'], format: 'uuid' },
      service_id: { type: ['string', 'null'], format: 'uuid' },
      title: { type: ['string', 'null'] },
      created_at: { type: ['string', 'null'], format: 'date-time' },
      updated_at: { type: ['string', 'null'], format: 'date-time' },
      last_message_at: { type: ['string', 'null'], format: 'date-time' },
      is_archived: { type: ['boolean', 'null'] }
    },
    required: ['id', 'chat_type'],
    additionalProperties: true
  },

  ChatEnvelope: {
    $id: 'ChatEnvelope',
    type: 'object',
    properties: {
      chat: { $ref: 'Chat#' }
    },
    required: ['chat'],
    additionalProperties: false
  }
};
