import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';

// Print installed Swagger version
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('@fastify/swagger/package.json');
console.log("FASTIFY SWAGGER VERSION:", pkg.version);

const fastify = Fastify({ logger: true });

// Register Swagger docs at /docs
fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Swagger Minimal Test',
      version: '1.0.0'
    }
  },
  exposeRoute: true,
  routePrefix: '/docs'
});

// Health check
fastify.get('/healthz', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });

    // After server is ready, print all registered routes
    fastify.ready(err => {
      if (err) throw err;
      console.log('REGISTERED ROUTES:');
      console.log(fastify.printRoutes());
    });

    fastify.log.info(`🚀 Minimal server listening`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
