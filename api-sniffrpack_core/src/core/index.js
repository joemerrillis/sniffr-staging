import fp from 'fastify-plugin';
import supabasePlugin from './supabase.js';
import errorHandlerPlugin from './error-handler.js';
import loggerPlugin from './logger.js';

export default fp(async function corePlugin(fastify, opts) {
  fastify.register(loggerPlugin);
  fastify.register(errorHandlerPlugin);
  fastify.register(supabasePlugin, {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  });
});
