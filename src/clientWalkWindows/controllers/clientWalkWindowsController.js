// src/clientWalkWindows/controllers/clientWalkWindowsController.js

import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow
} from '../services/clientWalkWindowsService.js';

/**
 * List all walk windows for this user
 */
export async function listWindows(request, reply) {
  const userId = request.user.id;
  const windows = await listClientWalkWindows(request.server, userId);
  reply.send({ windows });
}

/**
 * Get a single window by ID
 */
export async function getWindow(request, reply) {
  const userId = request.user.id;
  const { id } = request.params;
  const window = await getClientWalkWindow(request.server, userId, id);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }
  reply.send({ window });
}

/**
 * Create a new walk window
 */
export async function createWindow(request, reply) {
  const userId = request.user.id;
  // merge in the server-derived user_id
  const payload = { ...request.body, user_id: userId };
  const window = await createClientWalkWindow(request.server, payload);
  reply.code(201).send({ window });
}

/**
 * Update an existing walk window
 */
export async function updateWindow(request, reply) {
  const userId = request.user.id;
  const { id } = request.params;
  const payload = request.body;
  const window = await updateClientWalkWindow(request.server, userId, id, payload);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }
  reply.send({ window });
}

/**
 * Delete a walk window
 */
export async function deleteWindow(request, reply) {
  const userId = request.user.id;
  const { id } = request.params;
  await deleteClientWalkWindow(request.server, userId, id);
  reply.code(204).send();
}
