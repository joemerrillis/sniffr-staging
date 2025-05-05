// index.js
import Fastify from 'fastify';
import dotenv from 'dotenv';

// Core & route plugins
import corePlugin           from './src/core/index.js';
import authRoutes           from './src/auth/index.js';            // routes-only
import usersPlugin          from './src/users/index.js';
import tenantsPlugin        from './src/tenants/index.js';
import domainsPlugin        from './src/domains/index.js';
import dogsPlugin           from './src/dogs/index.js';
import visibilityPlugin     from './src/dogVisibility/index.js';
import dogFriendsPlugin     from './src/dogFriends/index.js';
import dogAssignmentsPlugin from './src/dogAssignments/index.js';

// Add JWT plugin
import fastifyJwt from '@fastify/jwt';

dotenv.config();

const fastify = Fastify({ logger: true });

// 1) Core wiring
fastify.register(corePlugin);

// 2) JWT setup
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET
});

// 3) Authentication decorator
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// 4) Auth *routes* (signup / login / profile) — public
fastify.register(authRoutes, { prefix: '/auth' });

// 5) Health check — public
fastify.get('/', async () => ({ status: 'ok' }));

// 6) Protect everything else with our new decorator
fastify.addHook('onRequest', fastify.authenticate);

// 7) Mount the rest of your modules
fastify.register(usersPlugin,          { prefix: '/users' });
fastify.register(tenantsPlugin,        { prefix: '/tenants' });
fastify.register(domainsPlugin,        { prefix: '/domains' });
fastify.register(dogsPlugin,           { prefix: '/dogs' });
fastify.register(visibilityPlugin,     { prefix: '/dogs/:id/visibility' });
fastify.register(dogFriendsPlugin,     { prefix: '/dog-friends' });
fastify.register(dogAssignmentsPlugin, { prefix: '/dog-assignments' });

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
