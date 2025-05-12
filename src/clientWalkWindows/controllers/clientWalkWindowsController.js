// src/clientWalkWindows/controllers/clientWalkWindowsController.js

import {
  listClientWalkWindows,
  getClientWalkWindow,
  createClientWalkWindow,
  updateClientWalkWindow,
  deleteClientWalkWindow
} from '../services/clientWalkWindowsService.js';

// helper to go from 0–6 → lowercase weekday
const DAY_MAP = [
  'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'
];

/**
 * List all walk windows for this user
 */
export async function listWindows(request, reply) {
  const userId = request.user.id;
  const windows = await listClientWalkWindows(request.server, userId);
  reply.send({ windows });
}

/**
 * Retrieve a single walk window by ID
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
 * Create a new walk window (day_of_week comes in as 0–6)
 */
export async function createWindow(request, reply) {
  const userId = request.user.id;
  const { day_of_week, ...rest } = request.body;

  if (
    typeof day_of_week !== 'number' ||
    day_of_week < 0 ||
    day_of_week > 6 ||
    !Number.isInteger(day_of_week)
  ) {
    return reply
      .code(400)
      .send({ error: 'day_of_week must be an integer 0 (Sunday) through 6 (Saturday)' });
  }
  const dowString = DAY_MAP[day_of_week];

  const payload = {
    ...rest,
    user_id:     userId,
    day_of_week: dowString
  };

  const window = await createClientWalkWindow(request.server, payload);
  reply.code(201).send({ window });
}

/**
 * Update an existing walk window by ID
 */
export async function updateWindow(request, reply) {
  const userId = request.user.id;
  const { id } = request.params;
  const { day_of_week, ...rest } = request.body;

  let payload = { ...rest };

  if (day_of_week !== undefined) {
    if (
      typeof day_of_week !== 'number' ||
      day_of_week < 0 ||
      day_of_week > 6 ||
      !Number.isInteger(day_of_week)
    ) {
      return reply
        .code(400)
        .send({ error: 'day_of_week must be an integer 0 (Sunday) through 6 (Saturday)' });
    }
    payload.day_of_week = DAY_MAP[day_of_week];
  }

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
  const userId = request.user.id;
  const { id } = request.params;
  await deleteClientWalkWindow(request.server, userId, id);
  reply.code(204).send();
}
