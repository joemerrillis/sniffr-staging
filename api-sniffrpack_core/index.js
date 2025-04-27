import Fastify from 'fastify';
import dotenv from 'dotenv';
import corePlugin from './src/core/index.js';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(corePlugin);

fastify.get('/', async () => {
  return { status: 'ok' };
});


const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000 });
    fastify.log.info(`Server listening on port ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
