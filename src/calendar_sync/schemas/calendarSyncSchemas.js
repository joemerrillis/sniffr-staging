// src/calendar_sync/schemas/calendarSyncSchemas.js

export const calendarSyncSchemas = {
  // ===== OAuth URL Envelope =====
  OAuthUrlEnvelope: {
    $id: 'OAuthUrlEnvelope',
    type: 'object',
    properties: {
      connection: {
        type: 'object',
        properties: {
          authUrl: { type: 'string', format: 'uri' }
        },
        required: ['authUrl']
      }
    },
    required: ['connection']
  },

  // ===== Calendar Connection Envelope =====
  CalendarConnectionEnvelope: {
    $id: 'CalendarConnectionEnvelope',
    type: 'object',
    properties: {
      connection: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          tenant_id: { type: ['string', 'null'], format: 'uuid' },
          provider: { type: 'string' },
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          last_synced: { type: ['string', 'null'], format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'user_id', 'provider', 'access_token', 'refresh_token', 'created_at']
      }
    },
    required: ['connection']
  },

  // ===== Calendar Events Envelope =====
  CalendarEventsEnvelope: {
    $id: 'CalendarEventsEnvelope',
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          // You can expand as needed; these are the common Google event fields:
          properties: {
            id: { type: 'string' },
            summary: { type: 'string' },
            description: { type: ['string', 'null'] },
            start: { type: 'object' },   // Google Calendar event date/time objects
            end: { type: 'object' },
            status: { type: 'string' }
          },
          required: ['id', 'summary', 'start', 'end', 'status']
        }
      }
    },
    required: ['events']
  },

  // ===== Sync Sniffr Events Envelope =====
  SyncedEventsEnvelope: {
    $id: 'SyncedEventsEnvelope',
    type: 'object',
    properties: {
      synced: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sniffrEvent: { type: 'object' }, // Original input
            google: { type: 'object' }       // Resulting Google event data
          },
          required: ['sniffrEvent', 'google']
        }
      }
    },
    required: ['synced']
  },

  // ===== Webhook Envelope =====
  CalendarWebhookEnvelope: {
    $id: 'CalendarWebhookEnvelope',
    type: 'object',
    properties: {
      webhook: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          result: { type: ['object', 'null'] }
        },
        required: ['status']
      }
    },
    required: ['webhook']
  }
};
