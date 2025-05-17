import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';

const fastify = Fastify({ logger: true });

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

fastify.get('/healthz', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`🚀 Minimal server listening`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
