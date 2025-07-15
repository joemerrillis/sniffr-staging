// src/boarding_reports/schemas/boardingReportsSchemas.js

export const boardingReportsSchemas = {
  // Core object
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
            completed_by: { type: ['string', 'null'], format: 'uuid' },
            // Add additional task fields if needed
          },
          required: ['key', 'label', 'completed'],
        },
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
            meta: { type: 'object' }, // meta must include boarding_id, dog_id, source, etc
          },
          required: ['dog_memory_id', 'image_url'],
        },
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
        items: { type: 'string', format: 'uuid' },
      },
      visibility: { type: ['string', 'null'], enum: ['private', 'client', 'staff', 'public'] },
    },
    required: [
      'id',
      'boarding_id',
      'dog_id',
      'status',
      'created_at',
    ],
    additionalProperties: false,
    example: {
      id: '7e7b3d3b-725e-4753-b71a-1234567890ab',
      boarding_id: 'caa674ae-7225-4ec6-b582-1234567890ab',
      dog_id: 'ffe844d2-9bfe-44e0-a07f-1234567890ab',
      start_time: '2024-07-14T15:00:00Z',
      end_time: '2024-07-15T10:00:00Z',
      summary: 'Luna did great! Ate all meals, playful.',
      tasks: [
        { key: 'feed_breakfast', label: 'Breakfast fed', completed: true, completed_at: '2024-07-15T07:00:00Z', completed_by: 'cd00e943-02ab-4f13-bb97-aaaaaaa1111a' },
        { key: 'meds_morning', label: 'AM meds given', completed: false }
      ],
      photos: [
        {
          dog_memory_id: 'abcd1234-5678-1234-efab-234567890123',
          image_url: 'https://sniffr-photos.s3.amazonaws.com/luna-breakfast.jpg',
          caption: 'Luna after breakfast',
          meta: { boarding_id: 'caa674ae-7225-4ec6-b582-1234567890ab', dog_id: 'ffe844d2-9bfe-44e0-a07f-1234567890ab', source: 'boarding_report' }
        }
      ],
      instructions_img_url: null,
      notes: 'No issues, very relaxed.',
      ai_story_json: null,
      transcript: null,
      created_at: '2024-07-14T15:00:00Z',
      updated_at: '2024-07-15T12:30:00Z',
      status: 'active',
      user_id: 'cd00e943-02ab-4f13-bb97-aaaaaaa1111a',
      staff_ids: ['cd00e943-02ab-4f13-bb97-aaaaaaa1111a'],
      visibility: 'client'
    }
  },

  // Envelope: single report
  BoardingReportEnvelope: {
    $id: 'BoardingReportEnvelope',
    type: 'object',
    properties: {
      boarding_report: { $ref: 'BoardingReport#' }
    },
    required: ['boarding_report'],
    additionalProperties: false,
    example: {
      boarding_report: { /* as above */ }
    }
  },

  // Envelope: list of reports
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
    additionalProperties: false,
    example: {
      boarding_reports: [ /* ...array of BoardingReport... */ ]
    }
  },

  // GET /boarding-reports querystring schema
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

  // Param: { id }
  BoardingReportIdParam: {
    $id: 'BoardingReportIdParam',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' }
    },
    required: ['id'],
    additionalProperties: false
  },

  // POST body: create
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
      notes: { type: ['string', 'null'] }
      // You can allow more fields if needed (e.g. tasks, summary) but typically tasks/summary are auto-generated or empty at creation
    },
    required: ['boarding_id', 'dog_id', 'user_id'],
    additionalProperties: false,
    example: {
      boarding_id: 'caa674ae-7225-4ec6-b582-1234567890ab',
      dog_id: 'ffe844d2-9bfe-44e0-a07f-1234567890ab',
      start_time: '2024-07-14T15:00:00Z',
      end_time: null,
      user_id: 'cd00e943-02ab-4f13-bb97-aaaaaaa1111a',
      instructions_img_url: null,
      notes: 'Please give meds at 8am.'
    }
  },

  // PATCH body: update
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
          required: ['key', 'label', 'completed'],
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
      // add any other fields that should be updatable
    },
    additionalProperties: false,
    example: {
      summary: 'Luna was calm at pickup.',
      notes: 'No issues',
      status: 'finalized',
      tasks: [
        { key: 'feed_breakfast', label: 'Breakfast fed', completed: true, completed_at: '2024-07-15T07:00:00Z', completed_by: 'cd00e943-02ab-4f13-bb97-aaaaaaa1111a' }
      ],
      photos: [
        {
          dog_memory_id: 'abcd1234-5678-1234-efab-234567890123',
          image_url: 'https://sniffr-photos.s3.amazonaws.com/luna-breakfast.jpg',
          caption: 'Luna after breakfast',
          meta: { boarding_id: 'caa674ae-7225-4ec6-b582-1234567890ab', dog_id: 'ffe844d2-9bfe-44e0-a07f-1234567890ab', source: 'boarding_report' }
        }
      ],
      ai_story_json: null,
      transcript: null,
      staff_ids: ['cd00e943-02ab-4f13-bb97-aaaaaaa1111a'],
      visibility: 'client'
    }
  },

  // DELETE envelope
  DeleteResultEnvelope: {
    $id: 'DeleteResultEnvelope',
    type: 'object',
    properties: {
      success: { type: 'boolean' }
    },
    required: ['success'],
    additionalProperties: false,
    example: { success: true }
  },

  // POST /boarding-reports/:id/complete-task (optional)
  CompleteTaskBody: {
    $id: 'CompleteTaskBody',
    type: 'object',
    properties: {
      task_key: { type: 'string' },
      completed_by: { type: 'string', format: 'uuid' },
      timestamp: { type: ['string', 'null'], format: 'date-time' }
    },
    required: ['task_key', 'completed_by'],
    additionalProperties: false,
    example: {
      task_key: 'meds_morning',
      completed_by: 'cd00e943-02ab-4f13-bb97-aaaaaaa1111a',
      timestamp: '2024-07-15T08:01:00Z'
    }
  },

  // POST /boarding-reports/:id/push-to-client (optional)
  PushToClientBody: {
    $id: 'PushToClientBody',
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['final_summary', 'new_photo', 'custom'] },
      message: { type: ['string', 'null'] }
    },
    required: ['type'],
    additionalProperties: false,
    example: {
      type: 'final_summary',
      message: 'Luna’s final boarding summary is ready!'
    }
  },

  PushToClientResultEnvelope: {
    $id: 'PushToClientResultEnvelope',
    type: 'object',
    properties: {
      success: { type: 'boolean' }
    },
    required: ['success'],
    additionalProperties: false,
    example: { success: true }
  }
};
