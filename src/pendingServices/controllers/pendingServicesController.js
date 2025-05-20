// src/pendingServices/controllers/pendingServicesController.js

import {
  listPendingServicesForUser,
  getPendingServiceForUser,
  listPendingServicesForClient,
  deletePendingService,
  deletePendingServiceAsTenant
} from '../services/pendingServicesService.js';

/**
 * Extract the authenticated user's ID from the JWT.
 */
function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

/**
 * List all pending services for the current user (client).
 */
async function list(request, reply) {
  const userId = getUserId(request);
  const pending_services = await listPendingServicesForUser(request.server, userId);
  reply.send({ pending_services });
}

/**
 * Get a single pending service by id (for the current user).
 */
async function retrieve(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const pending_service = await getPendingServiceForUser(request.server, userId, id);
  if (!pending_service) return reply.code(404).send({ error: 'Pending service not found' });
  reply.send({ pending_service });
}

/**
 * Delete a pending service (remove from cart) by id (for the current user).
 */
async function remove(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  await deletePendingService(request.server, userId, id);
  reply.code(204).send();
}

/**
 * TENANT: List all pending services for a specific client.
 */
async function listForClient(request, reply) {
  const { tenant_id, client_id } = request.params;

  // Optionally, you could check that the client belongs to the tenant
  // (You can add that security check if needed)

  const pending_services = await listPendingServicesForClient(request.server, client_id);
  reply.send({ pending_services });
}

/**
 * TENANT: Delete a pending service for a client (if needed).
 */
async function removeForClient(request, reply) {
  const { tenant_id, client_id, id } = request.params;
  await deletePendingServiceAsTenant(request.server, client_id, id);
  reply.code(204).send();
}

export {
  list,
  retrieve,
  remove,
  listForClient,
  removeForClient
};
