import fp from 'fastify-plugin';
import { createClient } from '@supabase/supabase-js';

export default fp(function supabase(fastify, opts, next) {
  const { url, key } = opts;
  if (!url || !key) {
    fastify.log.error('Missing SUPABASE_URL or SUPABASE_KEY');
    throw new Error('Supabase configuration is required');
  }
  const supabase = createClient(url, key);
  fastify.decorate('supabase', supabase);
  next();
});
