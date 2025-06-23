// src/chat/index.js

import fp from 'fastify-plugin';
import routes from './routes.js';
import { chatSchemas } from './schemas/chatSchemas.js';

export default fp(async function chatPlugin(fastify, opts) {
  // Register all schemas ONCE (ignore duplicate $id errors)
  for (const schema of Object.values(chatSchemas)) {
    try {
      fastify.addSchema(schema);
    } catch (e) {
      // Ignore FST_ERR_SCH_ALREADY_PRESENT
    }
  }
  fastify.register(routes);
});
