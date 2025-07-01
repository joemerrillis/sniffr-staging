import fp from 'fastify-plugin';
import walkReportsRoutes from './routes/walkReportsRoutes.js';
import { walkReportsSchemas } from './schemas/walkReportsSchemas.js';

export default fp(async function walkReportsPlugin(fastify, opts) {
  for (const schema of Object.values(walkReportsSchemas)) {
    try { fastify.addSchema(schema); } catch (e) {}
  }
  fastify.register(walkReportsRoutes);
});
