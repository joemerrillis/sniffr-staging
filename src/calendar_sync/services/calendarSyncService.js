// src/calendar_sync/services/calendarSyncService.js

import { google } from 'googleapis';
import dayjs from 'dayjs';

// ===== Utilities =====

function getOAuth2Client(tokens) {
  // You’ll want to configure these using ENV vars in production!
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  if (tokens) client.setCredentials(tokens);
  return client;
}

// ===== 1. Start Google OAuth Flow =====

export async function startGoogleOAuth(request, reply) {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar']
  });
  // You could also redirect directly here
  return { authUrl };
}

// ===== 2. Handle Google OAuth Callback =====

export async function handleGoogleOAuthCallback(request, reply) {
  const { code } = request.query;
  const user = request.user;

  const oauth2Client = getOAuth2Client();

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Store tokens in DB
  const { data, error } = await request.server.supabase
    .from('calendar_connections')
    .upsert([{
      user_id: user.id,
      tenant_id: user.tenant_id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      last_synced: null, // or new Date()
      created_at: dayjs().toISOString(),
    }], { onConflict: ['user_id', 'provider'] });

  if (error) throw error;
  return data[0];
}

// ===== 3. Connection Status =====

export async function getCalendarConnectionStatus(supabase, user) {
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single();
  if (error) throw error;
  return data;
}

// ===== 4. List All External Calendar Events =====

export async function listExternalCalendarEvents(supabase, user) {
  // 1. Get user’s tokens
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single();
  if (error || !data) throw error || new Error('No calendar connection found');

  const oauth2Client = getOAuth2Client({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const result = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  });

  // Could filter/massage here if needed
  return result.data.items || [];
}

// ===== 5. Sync Sniffr Events to Google Calendar =====

export async function syncSniffrEventsToCalendar(supabase, user, sniffrEvents) {
  // Get tokens
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single();
  if (error || !data) throw error || new Error('No calendar connection found');

  const oauth2Client = getOAuth2Client({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Prepare results
  const results = [];
  for (const sniffrEvent of sniffrEvents) {
    // Check if calendar_event_id exists
    let calendarEventId = sniffrEvent.calendar_event_id;
    let calendarEventResult;

    if (!calendarEventId) {
      // CREATE new Google event
      const event = {
        summary: sniffrEvent.summary,
        description: sniffrEvent.description,
        start: { dateTime: sniffrEvent.start_time },
        end: { dateTime: sniffrEvent.end_time },
        // ...add more fields as needed
      };
      const resp = await calendar.events.insert({ calendarId: 'primary', resource: event });
      calendarEventId = resp.data.id;
      calendarEventResult = resp.data;

      // Save mapping in calendar_events
      await supabase.from('calendar_events').upsert([{
        user_id: user.id,
        tenant_id: user.tenant_id,
        service_type: sniffrEvent.service_type,
        walk_id: sniffrEvent.walk_id || null,
        boarding_id: sniffrEvent.boarding_id || null,
        calendar_event_id: calendarEventId,
        status: 'confirmed',
        created_at: dayjs().toISOString()
      }], { onConflict: ['calendar_event_id'] });
    } else {
      // UPDATE Google event
      const event = {
        summary: sniffrEvent.summary,
        description: sniffrEvent.description,
        start: { dateTime: sniffrEvent.start_time },
        end: { dateTime: sniffrEvent.end_time },
      };
      const resp = await calendar.events.update({
        calendarId: 'primary',
        eventId: calendarEventId,
        resource: event
      });
      calendarEventResult = resp.data;
    }

    results.push({ sniffrEvent, google: calendarEventResult });
  }
  return results;
}

// ===== 6. Handle Google Calendar Webhook =====

export async function handleGoogleCalendarWebhook(supabase, payload) {
  // 1. Parse eventId from payload (structure depends on Google push format)
  const eventId = payload.eventId || (payload.resourceId ? payload.resourceId : null);
  if (!eventId) throw new Error('No event ID in webhook payload');

  // 2. Lookup calendar_event
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('calendar_event_id', eventId)
    .single();

  if (error || !data) {
    // Not a Sniffr event, log/flag as "external only"
    // Optionally, create a log entry or queue for review/conflict
    return { status: 'external', eventId };
  }

  // 3. (Optional) Sync changes back to Sniffr service
  // For demo: just return the mapped Sniffr event
  // In production: update corresponding walk/boarding as needed
  return { status: 'sniffr_match', mapping: data };
}
