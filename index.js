import Fastify from 'fastify';
import dotenv from 'dotenv';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

// --- Feature Plugins ---
import corePlugin from './src/core/index.js';
import authPlugin from './src/auth/index.js';
import usersPlugin from './src/users/index.js';
import tenantsPlugin from './src/tenants/index.js';
import domainsPlugin from './src/domains/index.js';
import dogsPlugin from './src/dogs/index.js';
import visibilityPlugin from './src/dogVisibility/index.js';
import dogFriendsPlugin from './src/dogFriends/index.js';
import dogAssignmentsPlugin from './src/dogAssignments/index.js';
import employeesPlugin from './src/employees/index.js';
import clientWalkersPlugin from './src/clientWalkers/index.js';
import tenantClientsPlugin from './src/tenantClients/index.js';
import walksPlugin from './src/walks/index.js';
import clientWalkWindowsPlugin from './src/clientWalkWindows/index.js';
import clientWalkRequestsPlugin from './src/clientWalkRequests/index.js';
import pendingServicesPlugin from './src/pendingServices/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// --- Register Swagger (OpenAPI) docs FIRST ---
await fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Sniffr API',
      description: 'API documentation for dog walking SaaS + social layer',
      version: '1.0.0'
    }
  }
});
// --- Register Swagger UI ---
await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
});

// --- Core (Supabase client, error hooks, logging) ---
await fastify.register(corePlugin);

// --- Public health check (no auth required) ---
fastify.get('/healthz', async () => ({ status: 'ok' }));

// --- Auth plugin (JWT, /auth routes, protects subsequent routes) ---
await fastify.register(authPlugin);

// --- Application modules (all with prefixes for isolation) ---
await fastify.register(usersPlugin, { prefix: '/users' });
await fastify.register(tenantsPlugin, { prefix: '/tenants' });
await fastify.register(domainsPlugin, { prefix: '/domains' });
await fastify.register(dogsPlugin, { prefix: '/dogs' });
await fastify.register(visibilityPlugin, { prefix: '/dogs/:id/visibility' });
await fastify.register(dogFriendsPlugin, { prefix: '/dog-friends' });
await fastify.register(dogAssignmentsPlugin, { prefix: '/dog-assignments' });
await fastify.register(employeesPlugin, { prefix: '/employees' });
await fastify.register(clientWalkersPlugin, { prefix: '/client-walkers' });
await fastify.register(tenantClientsPlugin, { prefix: '/tenant-clients' });
await fastify.register(walksPlugin, { prefix: '/walks' });
await fastify.register(clientWalkWindowsPlugin, { prefix: '/client-windows' });
await fastify.register(clientWalkRequestsPlugin, { prefix: '/client-walk-requests' });
await fastify.register(pendingServicesPlugin, { prefix: '/pending-services' });

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`🚀 Server listening on 0.0.0.0:${port}`);
    fastify.log.info(`📚 Swagger UI at /docs/static/index.html`);
    fastify.log.info(`❤️ Health check at /healthz`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
