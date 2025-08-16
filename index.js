import Fastify from 'fastify';
import dotenv from 'dotenv';
import Replicate from 'replicate';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyMultipart from '@fastify/multipart';

import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

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
fastify.get('/favicon.ico', async (req, reply) => reply.code(204).send());
fastify.head('/favicon.ico', async (req, reply) => reply.code(204).send());

await fastify.register(fastifyMultipart);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioFilePath = path.join(__dirname, 'public/audio.html');
console.log('__dirname:', __dirname);
console.log('Looking for:', audioFilePath);
console.log('Does file exist?', existsSync(audioFilePath));

// ---- 1. Serve static files at /public/static and root FIRST ----
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/rapi-doc/', // serves /public/rapi-doc/rapidoc.html at /rapi-doc/rapidoc.html
  decorateReply: false
});
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', // serves /public/audio.html at /audio.html
 
});

// ---- Quick debug route to verify static serving ----
fastify.get('/test-static', (req, reply) => {
  return reply.sendFile('audio.html');
});

// ---- 2. Register Swagger/OpenAPI ----
await fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Sniffr API',
      description: 'API documentation for dog walking SaaS + social layer',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  }
});

// ---- 3. Register Swagger UI ----
await fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'none',
    deepLinking: false
  }
});

// ---- 4. Core (Supabase client, error hooks, logging) ----
await fastify.register(corePlugin);

// ---- 5. Public health check (no auth required) ----
fastify.get('/healthz', async () => ({ status: 'ok' }));

// ---- 6. Auth plugin (JWT, /auth routes, protects subsequent routes) ----
await fastify.register(authPlugin);

// ---- 7. Application modules (all with prefixes for isolation) ----
await fastify.register(usersPlugin, { prefix: '/users' });
await fastify.register(householdsPlugin, { prefix: '/households' });
await fastify.register(tenantsPlugin, { prefix: '/tenants' });
await fastify.register(stripeConnectPlugin, { prefix: '/stripe-connect' });
await fastify.register(domainsPlugin, { prefix: '/domains' });
await fastify.register(employeesPlugin, { prefix: '/employees' });
await fastify.register(dogsPlugin, { prefix: '/dogs' });
await fastify.register(tenantClientsPlugin, { prefix: '/tenant-clients' });
await fastify.register(clientWalkersPlugin, { prefix: '/client-walkers' });
await fastify.register(dogAssignmentsPlugin, { prefix: '/dog-assignments' });
await fastify.register(clientWalkWindowsPlugin, { prefix: '/client-windows' });
await fastify.register(clientWalkRequestsPlugin, { prefix: '/client-walk-requests' });
await fastify.register(boardingsPlugin, { prefix: '/boardings' });
await fastify.register(daycareSessionsPlugin, { prefix: '/daycare_sessions' });
await fastify.register(pendingServicesPlugin, { prefix: '/pending-services' });
await fastify.register(purchasesPlugin, { prefix: '/purchases' });
await fastify.register(pricingRulesPlugin, { prefix: '/pricing-rules' });
await fastify.register(schedulingPlugin, { prefix: '/scheduling' });
await fastify.register(availabilityPlugin, { prefix: '/availability' });
await fastify.register(walksPlugin, { prefix: '/walks' });
await fastify.register(dogMemoriesPlugin, { prefix: '/dog-memories' });
await fastify.register(dogFriendsPlugin, { prefix: '/dog-friends' });
await fastify.register(visibilityPlugin, { prefix: '/dogs/:id/visibility' });
await fastify.register(chatPlugin, { prefix: '/chats' });
await fastify.register(walkReportsPlugin, { prefix: '/walk-reports' });
await fastify.register(dogEventsPlugin, { prefix: '/dog-events' });
await fastify.register(boardingReportsPlugin, {prefix: '/boarding-reports' });
await fastify.register(calendarSyncPlugin, {prefix: '/calendar-sync' });

// ---- 8. Custom endpoints go *after* static & plugin registration ----

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

async function getClipEmbeddingFromFile(filePath) {
  const file = readFileSync(filePath);
  const base64 = file.toString('base64');
  const dataUri = `data:image/${path.extname(filePath).substring(1)};base64,${base64}`;
  const output = await replicate.run(
    "krthr/clip-embeddings:latest",
    {
      input: { image: "https://imagedelivery.net/9wUa4dldcGfmWFQ1Xyg0gA/<image_id>/<variant_name>" },
    }
  );
  return output.embedding;
}

fastify.post('/dogs/:id/embedding', async (req, reply) => {
  const { id } = req.params;
  const { imagePath } = req.body;
  if (!imagePath) {
    return reply.code(400).send({ error: "Select a local imagePath<1MB to embed." });
  }
  try {
    const embedding = await getClipEmbeddingFromFile(imagePath);
    return { dogId: id, embedding };
  } catch (err) {
    fastify.log.error(err);
    return reply.code(500).send({ error: "Embedding failed" });
  }
});

// ---- 9. GLOBAL ERROR HANDLER ----
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, '[GLOBAL ERROR HANDLER]');
  if (error.validation) {
    reply.code(400).send({
      error: error.message || 'Validation error',
      details: error.validation,
      statusCode: 400
    });
  } else {
    reply
      .code(error.statusCode || 500)
      .send({
        error: error.message || error.toString(),
        statusCode: error.statusCode || 500,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`🚀 Server listening on 0.0.0.0:${port}`);
    fastify.log.info(`📚 Swagger UI at /docs`);
    fastify.log.info(`❤️ Health check at /healthz`);
    fastify.log.info(`📝 Static docs at /rapi-doc/rapidoc.html`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
