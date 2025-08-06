// src/calendar_sync/index.js

import fp from 'fastify-plugin';
import calendarSyncRoutes from './routes.js';
import { calendarSyncSchemas } from './schemas/calendarSyncSchemas.js';

export default fp(async function calendarSyncPlugin(fastify, opts) {
  // Register all schemas ONCE (avoid duplicate $id errors)
  for (const schema of Object.values(calendarSyncSchemas)) {
    try { fastify.addSchema(schema); } catch (e) { /* Ignore FST_ERR_SCH_ALREADY_PRESENT */ }
  }
  // Register the routes
  fastify.register(calendarSyncRoutes, { prefix: '/calendar-sync' });
});
