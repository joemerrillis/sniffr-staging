import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  WalkSchedule,
  WalksScheduleEnvelope
} from './schemas/schedulingSchemas.js';

export default fp(async function schedulingPlugin(fastify, opts) {
  fastify.addSchema(WalkSchedule);
  fastify.addSchema(WalksScheduleEnvelope);
  fastify.register(routes, opts);
});
