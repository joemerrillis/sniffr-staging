// src/calendar_sync/controllers/calendarSyncControllers.js

import {
  startGoogleOAuth,
  handleGoogleOAuthCallback,
  getCalendarConnectionStatus,
  listExternalCalendarEvents,
  syncSniffrEventsToCalendar,
  handleGoogleCalendarWebhook,
} from '../services/calendarSyncService.js';

// 1. Start Google OAuth flow
export async function startGoogleOAuthController(request, reply) {
  try {
    const result = await startGoogleOAuth(request, reply);
    reply.send({ connection: result });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({ error: 'Failed to start Google OAuth' });
  }
}

// 2. Handle Google OAuth callback
export async function handleGoogleOAuthCallbackController(request, reply) {
  try {
    const result = await handleGoogleOAuthCallback(request, reply);
    reply.send({ connection: result });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({ error: 'Failed to handle Google OAuth callback' });
  }
}

// 3. Connection status
export async function getCalendarConnectionStatusController(request, reply) {
  try {
    const user = request.user; // assume user is injected via auth decorator
    const result = await getCalendarConnectionStatus(request.server.supabase, user);
    reply.send({ connection: result });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({ error: 'Failed to get connection status' });
  }
}

// 4. List all external calendar events
export async function listExternalCalendarEventsController(request, reply) {
  try {
    const user = request.user;
    const result = await listExternalCalendarEvents(request.server.supabase, user);
    reply.send({ events: result });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({ error: 'Failed to list calendar events' });
  }
}

// 5. Sync Sniffr events to Google Calendar
export async function syncSniffrEventsToCalendarController(request, reply) {
  try {
    const user = request.user;
    const { events } = request.body; // expected: { events: [...] }
    const result = await syncSniffrEventsToCalendar(request.server.supabase, user, events);
    reply.send({ synced: result });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({ error: 'Failed to sync events to calendar' });
  }
}

// 6. Handle Google Calendar webhook
export async function handleGoogleCalendarWebhookController(request, reply) {
  try {
    const payload = request.body;
    const result = await handleGoogleCalendarWebhook(request.server.supabase, payload);
    reply.send({ webhook: { status: 'ok', result } });
  } catch (err) {
    request.log.error(err);
    reply.code(500).send({ error: 'Webhook handling failed' });
  }
}
