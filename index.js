import Fastify from 'fastify';
import dotenv from 'dotenv';

import corePlugin           from './src/core/index.js';
import authPlugin           from './src/auth/index.js';            // plugin does JWT + decorate + global hook
import usersPlugin          from './src/users/index.js';
import tenantsPlugin        from './src/tenants/index.js';
import domainsPlugin        from './src/domains/index.js';
import dogsPlugin           from './src/dogs/index.js';
import visibilityPlugin     from './src/dogVisibility/index.js';
import dogFriendsPlugin     from './src/dogFriends/index.js';
import dogAssignmentsPlugin from './src/dogAssignments/index.js';
import employeesPlugin      from './src/employees/index.js';
import clientWalkersPlugin from './src/clientWalkers/index.js';
import tenantClientsPlugin from './src/tenantClients/index.js';
import walksPlugin from './src/walks/index.js';
import clientWalkWindowsPlugin from './src/clientWalkWindows/index.js';
import clientWalkRequestsPlugin from './src/clientWalkRequests/index.js';
import pendingServicesPlugin from './src/pendingServices/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// 1) Core (Supabase client, error hooks, logging)
fastify.register(corePlugin);

// 2) Public health check (no auth required)
fastify.get('/', async () => ({ status: 'ok' }));

// 3) Auth‐plugin:
//    - Registers @fastify/jwt
//    - Decorates fastify.authenticate
//    - Adds global onRequest hook to protect subsequent routes
//    - Registers /auth routes
fastify.register(authPlugin);

// 4) Mount your application modules (now protected):
fastify.register(usersPlugin,          { prefix: '/users' });
fastify.register(tenantsPlugin,        { prefix: '/tenants' });
fastify.register(domainsPlugin,        { prefix: '/domains' });
fastify.register(dogsPlugin,           { prefix: '/dogs' });
fastify.register(visibilityPlugin,     { prefix: '/dogs/:id/visibility' });
fastify.register(dogFriendsPlugin,     { prefix: '/dog-friends' });
fastify.register(dogAssignmentsPlugin, { prefix: '/dog-assignments' });
fastify.register(employeesPlugin,      { prefix: '/employees' });
fastify.register(clientWalkersPlugin, { prefix: '/client-walkers' });
fastify.register(tenantClientsPlugin, { prefix: '/tenant-clients' });
fastify.register(walksPlugin, { prefix: '/walks' });
fastify.register(clientWalkWindowsPlugin, { prefix: '/client-windows' });
fastify.register(clientWalkRequestsPlugin, { prefix: '/client-walk-requests' });
fastify.register(pendingServicesPlugin, { prefix: '/pending-services' });


const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`🚀 Server listening on 0.0.0.0:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
