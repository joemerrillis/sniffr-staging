// src/clientWalkRequests/index.js
import fp from 'fastify-plugin';
import routes from './routes.js';
import {
  ClientWalkRequest,
  RequestsEnvelope,
  RequestEnvelope,
  CreateClientWalkRequest,
  UpdateClientWalkRequest
} from './schemas/clientWalkRequestsSchemas.js';

export default fp(async function clientWalkRequestsModule(fastify, opts) {
  fastify.addSchema(ClientWalkRequest);
  fastify.addSchema(RequestsEnvelope);
  fastify.addSchema(RequestEnvelope);
  fastify.addSchema(CreateClientWalkRequest);
  fastify.addSchema(UpdateClientWalkRequest);
  fastify.register(routes, opts);
});
