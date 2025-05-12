// src/clientWalkWindows/schemas/clientWalkWindowsSchemas.js

export const ClientWalkWindow = {
  type: 'object',
  properties: {
    id:   { type: 'string', format: 'uuid' },
    client_id: { type: 'string', format: 'uuid' },
    day_of_week: {
      type: 'string',
      enum: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    },
    start_time: { type: 'string', pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$' },
    end_time:   { type: 'string', pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$' },
    vacation_start_date: { type: ['string','null'], format: 'date' },
    vacation_end_date:   { type: ['string','null'], format: 'date' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  },
  required: ['id','client_id','day_of_week','start_time','end_time']
};

export const CreateClientWalkWindow = {
  type: 'object',
  properties: {
    day_of_week: {
      type: 'string',
      enum: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    },
    start_time: { type: 'string', pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$' },
    end_time:   { type: 'string', pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$' },
    vacation_start_date: { type: 'string', format: 'date' },
    vacation_end_date:   { type: 'string', format: 'date' }
  },
  required: ['day_of_week','start_time','end_time']
};

export const UpdateClientWalkWindow = {
  type: 'object',
  properties: {
    day_of_week: {
      type: 'string',
      enum: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    },
    start_time: { type: 'string', pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$' },
    end_time:   { type: 'string', pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$' },
    vacation_start_date: { type: 'string', format: 'date' },
    vacation_end_date:   { type: 'string', format: 'date' }
  }
};
