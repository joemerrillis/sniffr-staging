import fp from 'fastify-plugin';
import calendarSyncRoutes from './routes.js';
// If you add modular routes later, import here as needed.

import { calendarSyncSchemas } from './schemas/calendarSyncSchemas.js';

export default fp(async function calendarSyncPlugin(fastify, opts) {
  // Register each schema by name for maximum control/consistency
  fastify.addSchema(calendarSyncSchemas.OAuthUrlEnvelope);
  fastify.addSchema(calendarSyncSchemas.CalendarConnectionEnvelope);
  fastify.addSchema(calendarSyncSchemas.CalendarEventsEnvelope);
  fastify.addSchema(calendarSyncSchemas.SyncedEventsEnvelope);
  fastify.addSchema(calendarSyncSchemas.CalendarWebhookEnvelope);

  // Register your main calendar sync routes (and any future modular routes)
  fastify.register(calendarSyncRoutes, opts);
});
