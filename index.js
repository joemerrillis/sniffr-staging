import Fastify from 'fastify';
import dotenv from 'dotenv';

import corePlugin    from './src/core/index.js';
import authPlugin    from './src/auth/index.js';
import usersPlugin   from './src/users/index.js';
import tenantsPlugin from './src/tenants/index.js';
import domainsPlugin from './src/domains/index.js';
import dogsPlugin    from './src/dogs/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Core (Supabase client, error handler, logging, etc.)
fastify.register(corePlugin);

// Public health check
fastify.get('/', async () => ({ status: 'ok' }));

// Auth (register, login, profile)
fastify.register(authPlugin, { prefix: '/auth' });

// User management
fastify.register(usersPlugin, { prefix: '/users' });

// Tenant management
fastify.register(tenantsPlugin, { prefix: '/tenants' });

// Custom domains
fastify.register(domainsPlugin, { prefix: '/domains' });

// Dog profiles & media
fastify.register(dogsPlugin, { prefix: '/dogs' });

const start = async () => {
  try {
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
