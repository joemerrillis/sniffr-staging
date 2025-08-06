// src/calendar_sync/routes.js

import {
  startGoogleOAuthController,
  handleGoogleOAuthCallbackController,
  getCalendarConnectionStatusController,
  listExternalCalendarEventsController,
  syncSniffrEventsToCalendarController,
  handleGoogleCalendarWebhookController,
} from './controllers/calendarSyncControllers.js';

export default async function calendarSyncRoutes(fastify, opts) {
  // Tag for Swagger grouping
  const TAG = 'CalendarSync';

  // 1. Start Google OAuth2 flow
  fastify.route({
    method: 'POST',
    url: '/calendar-connections/google',
    handler: startGoogleOAuthController,
    schema: {
      tags: [TAG],
      response: { 200: { type: 'object', properties: { connection: { type: 'object' } } } }
    }
  });

  // 2. Handle Google OAuth2 callback
  fastify.route({
    method: 'GET',
    url: '/calendar-connections/google/callback',
    handler: handleGoogleOAuthCallbackController,
    schema: {
      tags: [TAG],
      querystring: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      response: { 200: { type: 'object', properties: { connection: { type: 'object' } } } }
    }
  });

  // 3. Get user's connection status
  fastify.route({
    method: 'GET',
    url: '/calendar-connections/status',
    handler: getCalendarConnectionStatusController,
    schema: {
      tags: [TAG],
      response: { 200: { type: 'object', properties: { connection: { type: 'object' } } } }
    }
  });

  // 4. List all Google Calendar events for the user
  fastify.route({
    method: 'GET',
    url: '/calendar-events',
    handler: listExternalCalendarEventsController,
    schema: {
      tags: [TAG],
      response: { 200: { type: 'object', properties: { events: { type: 'array', items: { type: 'object' } } } } }
    }
  });

  // 5. Sync Sniffr events to Google Calendar
  fastify.route({
    method: 'POST',
    url: '/calendar-events/sync',
    handler: syncSniffrEventsToCalendarController,
    schema: {
      tags: [TAG],
      body: {
        type: 'object',
        properties: {
          events: { type: 'array', items: { type: 'object' } }
        },
        required: ['events']
      },
      response: { 200: { type: 'object', properties: { synced: { type: 'array', items: { type: 'object' } } } } }
    }
  });

  // 6. Handle Google Calendar webhook push notifications
  fastify.route({
    method: 'POST',
    url: '/calendar-webhook/google',
    handler: handleGoogleCalendarWebhookController,
    schema: {
      tags: [TAG],
      body: { type: 'object' }, // Accept any payload, refine if you want strictness
      response: { 200: { type: 'object', properties: { webhook: { type: 'object' } } } }
    }
  });
}
