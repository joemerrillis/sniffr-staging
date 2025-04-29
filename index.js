import Fastify from 'fastify';
import dotenv from 'dotenv';
import corePlugin from './src/core/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Core plugins: Supabase client, error handler, logger hooks
fastify.register(corePlugin);

// Unprotected health check
fastify.get('/', async () => ({ status: 'ok' }));

// Register auth routes under /auth
fastify.register(import('./src/auth/index.js'), { prefix: '/auth' });

// Register users under /users
fastify.register(import('./src/users/index.js'), { prefix: '/users' });

// **Domains**
fastify.register(import('./src/domains/index.js'), { prefix: '/domains' });

// **Tenants**
fastify.register(import('./src/tenants/index.js'), { prefix: '/tenants' });


// TODO: later register users, tenants, etc.:
// fastify.register(import('./src/users/index.js'),   { prefix: '/users' });
// fastify.register(import('./src/tenants/index.js'), { prefix: '/tenants' });

const start = async () => {
  try {
    // Use Render’s injected PORT (or fallback to 3000) and bind to all interfaces
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    const address = fastify.server.address();
    fastify.log.info(`🚀 Server listening on ${address.address}:${address.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
