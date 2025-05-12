export const Window = {
  type: 'object',
  properties: {
    id:              { type: 'string', format: 'uuid' },
    user_id:         { type: 'string', format: 'uuid' },
    day_of_week:     { type: 'string', enum: ['0','1','2','3','4','5','6'] },
    window_start:    { type: 'string', format: 'time' },
    window_end:      { type: 'string', format: 'time' },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string', 'null'], format: 'date' },
    created_at:      { type: 'string', format: 'date-time' }
  },
  required: ['id','user_id','day_of_week','window_start','window_end','effective_start']
};

export const CreateWindow = {
  type: 'object',
  properties: {
    day_of_week:     { type: 'string', enum: ['0','1','2','3','4','5','6'] },
    window_start:    { type: 'string', format: 'time' },
    window_end:      { type: 'string', format: 'time' },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string','null'], format: 'date' }
  },
  required: ['day_of_week','window_start','window_end','effective_start']
};

export const UpdateWindow = {
  type: 'object',
  properties: {
    day_of_week:     { type: 'string', enum: ['0','1','2','3','4','5','6'] },
    window_start:    { type: 'string', format: 'time' },
    window_end:      { type: 'string', format: 'time' },
    effective_start: { type: 'string', format: 'date' },
    effective_end:   { type: ['string','null'], format: 'date' }
  }
};
