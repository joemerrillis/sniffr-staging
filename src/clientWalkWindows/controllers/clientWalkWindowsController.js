// src/clientWalkWindows/controllers/clientWalkWindowsController.js

import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow
} from '../services/clientWalkWindowsService.js';

/**
 * Helper: grab the user ID from the decoded JWT.
 * We check both .id and .sub to cover whichever claim you signed.
 */
function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

/**
 * List all walk windows for the current user
 */
export async function listWindows(request, reply) {
  const userId = getUserId(request);
  const windows = await listClientWalkWindows(request.server, userId);
  reply.send({ windows });
}

/**
 * Retrieve a single walk window by ID
 */
export async function getWindow(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;

  const window = await getClientWalkWindow(request.server, userId, id);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }

  reply.send({ window });
}

/**
 * Create a new walk window (day_of_week must be 0–6)
 */
export async function createWindow(request, reply) {
  const userId = getUserId(request);
  const { day_of_week, window_start, window_end, effective_start, effective_end } = request.body;

  // Validate day_of_week
  if (
    typeof day_of_week !== 'number' ||
    !Number.isInteger(day_of_week) ||
    day_of_week < 0 ||
    day_of_week > 6
  ) {
    return reply
      .code(400)
      .send({ error: 'day_of_week must be an integer 0 (Sunday) through 6 (Saturday)' });
  }

  const payload = {
    user_id:         userId,
    day_of_week,     // keep as integer
    window_start,
    window_end,
    effective_start,
    effective_end
  };

  const window = await createClientWalkWindow(request.server, payload);
  reply.code(201).send({ window });
}

/**
 * Update an existing walk window by ID
 */
export async function updateWindow(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  const { day_of_week, window_start, window_end, effective_start, effective_end } = request.body;

  // Build update payload
  const payload = {};
  if (day_of_week !== undefined) {
    if (
      typeof day_of_week !== 'number' ||
      !Number.isInteger(day_of_week) ||
      day_of_week < 0 ||
      day_of_week > 6
    ) {
      return reply
        .code(400)
        .send({ error: 'day_of_week must be an integer 0 (Sunday) through 6 (Saturday)' });
    }
    payload.day_of_week = day_of_week;
  }
  if (window_start     !== undefined) payload.window_start     = window_start;
  if (window_end       !== undefined) payload.window_end       = window_end;
  if (effective_start  !== undefined) payload.effective_start  = effective_start;
  if (effective_end    !== undefined) payload.effective_end    = effective_end;

  const window = await updateClientWalkWindow(request.server, userId, id, payload);
  if (!window) {
    return reply.code(404).send({ error: 'Window not found' });
  }

  reply.send({ window });
}

/**
 * Delete a walk window by ID
 */
export async function deleteWindow(request, reply) {
  const userId = getUserId(request);
  const { id } = request.params;
  await deleteClientWalkWindow(request.server, userId, id);
  reply.code(204).send();
}
