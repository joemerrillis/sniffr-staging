// src/clientWalkWindows/controllers/clientWalkWindowsController.js

import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow
} from '../services/clientWalkWindowsService.js';

/**
 * List all windows for the logged-in client
 */
export async function listWindows(request, reply) {
  const clientId = request.user.client_id;
  const windows = await listClientWalkWindows(request.server, clientId);
  reply.send({ windows });
}

/**
 * Retrieve a single window by ID (and owner)
 */
export async function getWindow(request, reply) {
  const clientId = request.user.client_id;
  const { id } = request.params;
  const window = await getClientWalkWindow(request.server, clientId, id);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }
  reply.send({ window });
}

/**
 * Create a new window for the logged-in client
 */
export async function createWindow(request, reply) {
  const clientId = request.user.client_id;
  const payload = { ...request.body, client_id: clientId };
  const window = await createClientWalkWindow(request.server, payload);
  reply.code(201).send({ window });
}

/**
 * Update an existing window (only if it belongs to this client)
 */
export async function updateWindow(request, reply) {
  const clientId = request.user.client_id;
  const { id } = request.params;
  const payload = request.body;
  const window = await updateClientWalkWindow(request.server, clientId, id, payload);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }
  reply.send({ window });
}

/**
 * Delete a window (only if it belongs to this client)
 */
export async function deleteWindow(request, reply) {
  const clientId = request.user.client_id;
  const { id } = request.params;
  await deleteClientWalkWindow(request.server, clientId, id);
  reply.code(204).send();
}
