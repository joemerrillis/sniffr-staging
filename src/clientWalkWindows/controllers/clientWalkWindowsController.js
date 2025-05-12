// src/clientWalkWindows/controllers/clientWalkWindowsController.js
import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow
} from '../services/clientWalkWindowsService.js';

/**
 * List all walk windows
 */
export async function listWindows(request, reply) {
  const windows = await listClientWalkWindows(request.server);
  reply.send({ windows });
}

/**
 * Retrieve a single walk window by ID
 */
export async function getWindow(request, reply) {
  const { id } = request.params;
  const window = await getClientWalkWindow(request.server, id);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }
  reply.send({ window });
}

/**
 * Create a new walk window
 */
export async function createWindow(request, reply) {
  const payload = request.body;
  const window = await createClientWalkWindow(request.server, payload);
  reply.code(201).send({ window });
}

/**
 * Update an existing walk window by ID
 */
export async function updateWindow(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  const window = await updateClientWalkWindow(request.server, id, payload);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }
  reply.send({ window });
}

/**
 * Delete a walk window by ID
 */
export async function deleteWindow(request, reply) {
  const { id } = request.params;
  await deleteClientWalkWindow(request.server, id);
  reply.code(204).send();
}
