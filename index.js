// index.js
import Fastify from 'fastify';
import dotenv from 'dotenv';
import corePlugin from './src/core/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Core plugins: Supabase client, error handler, logger hooks
fastify.register(corePlugin);

// Unprotected health check
fastify.get('/', async () => ({ status: 'ok' }));

// TODO: later register auth, users, tenants, etc:
// fastify.register(import('./src/auth/index.js'));
// fastify.register(import('./src/users/index.js'), { prefix: '/users' });

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000 });
    fastify.log.info(`🚀 Server listening on port ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
