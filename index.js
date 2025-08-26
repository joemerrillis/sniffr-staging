import Fastify from 'fastify';
import dotenv from 'dotenv';
import Replicate from 'replicate';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// --- Feature Plugins ---
import corePlugin from './src/core/index.js';
import authPlugin from './src/auth/index.js';
import usersPlugin from './src/users/index.js';
import tenantsPlugin from './src/tenants/index.js';
import stripeConnectPlugin from './src/stripe_connect/index.js';
import householdsPlugin from './src/households/index.js';
import domainsPlugin from './src/domains/index.js';
import employeesPlugin from './src/employees/index.js';
import dogsPlugin from './src/dogs/index.js';
import tenantClientsPlugin from './src/tenantClients/index.js';
import clientWalkersPlugin from './src/clientWalkers/index.js';
import dogAssignmentsPlugin from './src/dogAssignments/index.js';
import clientWalkWindowsPlugin from './src/clientWalkWindows/index.js';
import clientWalkRequestsPlugin from './src/clientWalkRequests/index.js';
import boardingsPlugin from './src/boardings/index.js';
import daycareSessionsPlugin from './src/daycare_sessions/index.js';
import pendingServicesPlugin from './src/pendingServices/index.js';
import purchasesPlugin from './src/purchases/index.js';
import pricingRulesPlugin from './src/pricingRules/index.js';
import schedulingPlugin from './src/scheduling/index.js';
import availabilityPlugin from './src/availability/index.js';
import walksPlugin from './src/walks/index.js';
import dogMemoriesPlugin from './src/dog_memories/index.js';
import dogFriendsPlugin from './src/dogFriends/index.js';
import visibilityPlugin from './src/dogVisibility/index.js';
import chatPlugin from './src/chat/index.js';
import walkReportsPlugin from './src/walk_reports/index.js';
import dogEventsPlugin from './src/dog_events/index.js';
import boardingReportsPlugin from './src/boarding_reports/index.js';
import calendarSyncPlugin from './src/calendar_sync/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Serve a 204 for missing favicon quickly
fastify.get('/favicon.ico', async (_req, reply) => reply.code(204).send());
fastify.head('/favicon.ico', async (_req, reply) => reply.code(204).send());

await fastify.register(fastifyMultipart);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- 1) Static files (RapiDoc + misc) at ROOT (not under /api) ----
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/rapi-doc/', // e.g. /rapi-doc/rapidoc.html
  decorateReply: false,
});
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', // e.g. /audio.html
});

// Optional quick debug route to verify static serving
fastify.get('/test-static', (req, reply) => reply.sendFile('audio.html'));

// ---- 2) OpenAPI/Swagger (ROOT) ----
await fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Sniffr API',
      description: 'API documentation for dog walking SaaS + social layer',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
});

await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'none', deepLinking: false },
});

// ---- 3) Core (Supabase client, hooks, logging) ----
await fastify.register(corePlugin);

// ---- 4) Public health check (ROOT) ----
fastify.get('/healthz', async () => ({ status: 'ok' }));

// ---- 5) API scope (EVERYTHING under /api, incl. auth + feature plugins) ----
await fastify.register(async function apiScope(api) {
  // Auth (its routes will be under /api/auth and its guards apply within this scope)
  await api.register(authPlugin);

  // Feature modules (unchanged prefixes, now under /api/…)
  await api.register(usersPlugin, { prefix: '/users' });
  await api.register(householdsPlugin, { prefix: '/households' });
  await api.register(tenantsPlugin, { prefix: '/tenants' });
  await api.register(stripeConnectPlugin, { prefix: '/stripe-connect' });
  await api.register(domainsPlugin, { prefix: '/domains' });
  await api.register(employeesPlugin, { prefix: '/employees' });
  await api.register(dogsPlugin, { prefix: '/dogs' });
  await api.register(tenantClientsPlugin, { prefix: '/tenant-clients' });
  await api.register(clientWalkersPlugin, { prefix: '/client-walkers' });
  await api.register(dogAssignmentsPlugin, { prefix: '/dog-assignments' });
  await api.register(clientWalkWindowsPlugin, { prefix: '/client-windows' });
  await api.register(clientWalkRequestsPlugin, { prefix: '/client-walk-requests' });
  await api.register(boardingsPlugin, { prefix: '/boardings' });
  await api.register(daycareSessionsPlugin, { prefix: '/daycare_sessions' });
  await api.register(pendingServicesPlugin, { prefix: '/pending-services' });
  await api.register(purchasesPlugin, { prefix: '/purchases' });
  await api.register(pricingRulesPlugin, { prefix: '/pricing-rules' });
  await api.register(schedulingPlugin, { prefix: '/scheduling' });
  await api.register(availabilityPlugin, { prefix: '/availability' });
  await api.register(walksPlugin, { prefix: '/walks' });
  await api.register(dogMemoriesPlugin, { prefix: '/dog-memories' });
  await api.register(dogFriendsPlugin, { prefix: '/dog-friends' });
  await api.register(visibilityPlugin, { prefix: '/dogs/:id/visibility' });
  await api.register(chatPlugin, { prefix: '/chats' });
  await api.register(walkReportsPlugin, { prefix: '/walk-reports' });
  await api.register(dogEventsPlugin, { prefix: '/dog-events' });
  await api.register(boardingReportsPlugin, { prefix: '/boarding-reports' });
  await api.register(calendarSyncPlugin, { prefix: '/calendar-sync' });

  // ---- Custom endpoint (moved under /api) ----
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  async function getClipEmbeddingFromFile(filePath) {
    const file = readFileSync(filePath);
    const base64 = file.toString('base64');
    const ext = path.extname(filePath).slice(1) || 'png';
    const dataUri = `data:image/${ext};base64,${base64}`;
    // NOTE: the model input below expects a URL; adjust if you really want to send dataUri
    const output = await replicate.run('krthr/clip-embeddings:latest', {
      input: { image: dataUri },
    });
    return output.embedding;
  }

  api.post('/dogs/:id/embedding', async (req, reply) => {
    const { id } = req.params;
    const { imagePath } = req.body || {};
    if (!imagePath) return reply.code(400).send({ error: 'Select a local imagePath<1MB to embed.' });
    try {
      const embedding = await getClipEmbeddingFromFile(imagePath);
      return { dogId: id, embedding };
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: 'Embedding failed' });
    }
  });
}, { prefix: '/api' });

// ---- 6) Global error handler ----
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, '[GLOBAL ERROR HANDLER]');
  if (error.validation) {
    reply.code(400).send({
      error: error.message || 'Validation error',
      details: error.validation,
      statusCode: 400,
    });
  } else {
    reply.code(error.statusCode || 500).send({
      error: error.message || String(error),
      statusCode: error.statusCode || 500,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
  }
});

// ---- 7) Start server ----
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`🚀 Server listening on 0.0.0.0:${port}`);
    fastify.log.info(`📚 Swagger UI at /docs`);
    fastify.log.info(`❤️ Health check at /healthz`);
    fastify.log.info(`📝 RapiDoc at /rapi-doc/rapidoc.html`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
