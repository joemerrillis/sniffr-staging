import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const fastify = Fastify({ logger: true });

// Register Swagger plugin
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'SniffrPack API',
      description: 'API documentation for SniffrPack',
      version: '1.0.0'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local server' }
    ]
  }
});

// Register Swagger UI plugin
await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
});

// Example route
fastify.get('/healthz', {
  schema: {
    description: 'Health check endpoint',
    tags: ['Health'],
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          status: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  return { status: 'ok' };
});

// Start the server
try {
  const port = Number(process.env.PORT) || 3000;
await fastify.listen({ port, host: '0.0.0.0' });
  console.log('Server is running at http://localhost:3000');
  console.log('Swagger UI available at http://localhost:3000/docs');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
