// src/clientWalkWindows/controllers/clientWalkWindowsController.js

import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow,
  listWindowsForWeek as listService
} from '../services/clientWalkWindowsService.js';

// 1) List all windows for current user
export async function listWindows(request, reply) {
  const userId = request.user.userId;
  const data = await listClientWalkWindows(request.server, userId);
  // wrap in envelope
  reply.send({ windows: data });
}

// 2) Retrieve a single window by ID
export async function getWindow(request, reply) {
  const userId = request.user.userId;
  const { id } = request.params;
  const window = await getClientWalkWindow(request.server, userId, id);
  if (!window) return reply.code(404).send({ error: 'Window not found' });
  reply.send({ window });
}

// 3) Create a new window
export async function createWindow(request, reply) {
  const userId = request.user.userId;
  const payload = { ...request.body, user_id: userId };
  const window = await createClientWalkWindow(request.server, payload);
  reply.code(201).send({ window });
}

// 4) Update an existing window
export async function updateWindow(request, reply) {
  const userId = request.user.userId;
  const { id } = request.params;
  const window = await updateClientWalkWindow(request.server, userId, id, request.body);
  if (!window) return reply.code(404).send({ error: 'Window not found' });
  reply.send({ window });
}

// 5) Delete a window
export async function deleteWindow(request, reply) {
  const userId = request.user.userId;
  const { id } = request.params;
  await deleteClientWalkWindow(request.server, userId, id);
  reply.code(204).send();
}

// 6) List windows for a given week
export async function listWindowsForWeek(request, reply) {
  const userId = request.user.userId;
  const { week_start } = request.query;
  const data = await listService(request.server, userId, week_start);
  reply.send({ windows: data });
}
