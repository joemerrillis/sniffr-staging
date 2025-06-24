import fp from 'fastify-plugin';
import { householdSchemas } from './schemas/householdSchemas.js';
import householdRoutes from './routes/householdRoutes.js';
import householdMemberRoutes from './routes/householdMemberRoutes.js';

export default fp(async function householdsPlugin(fastify, opts) {
  // Register schemas
  for (const schema of Object.values(householdSchemas)) {
    try {
      fastify.addSchema(schema);
    } catch {}
  }
  await householdRoutes(fastify, opts);
  await householdMemberRoutes(fastify, opts);
});
