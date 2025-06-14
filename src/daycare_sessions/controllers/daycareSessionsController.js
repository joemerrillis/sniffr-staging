// src/daycare_sessions/controllers/daycareSessionsController.js

import {
  listDaycareSessions,
  getDaycareSession,
  updateDaycareSession,
  deleteDaycareSession
} from '../services/daycareSessionsService.js';
import createDaycareSession from '../services/createDaycareSession.js';

// Helper: fetch all owned dog_ids if needed
async function fetchOwnedDogIds(server, user_id) {
  const { data, error } = await server.supabase
    .from('dog_owners')
    .select('dog_id')
    .eq('user_id', user_id);
  if (error) return [];
  return (data || []).map(row => row.dog_id);
}

// List all daycare sessions with optional filters
export async function list(req, reply) {
  try {
    const filters = req.query;
    const sessions = await listDaycareSessions(filters);
    reply.send({ sessions });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

// Retrieve a single daycare session by ID
export async function retrieve(req, reply) {
  try {
    const { id } = req.params;
    const session = await getDaycareSession(id);
    reply.send({ session });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

// Create a new daycare session (normalizes dog_ids from dog_id or dog_owners)
export async function create(req, reply) {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const server = req.server;
    let payload = { ...req.body, user_id };

    // Normalize dog_ids: use dog_id if present, otherwise fetch all owned dogs
    if (!payload.dog_ids || !Array.isArray(payload.dog_ids) || payload.dog_ids.length === 0) {
      if (payload.dog_id) {
        payload.dog_ids = [payload.dog_id];
      } else {
        const ownedDogIds = await fetchOwnedDogIds(server, user_id);
        if (!ownedDogIds.length) {
          return reply.code(400).send({ error: 'No dogs found for this user. Please specify at least one dog.' });
        }
        payload.dog_ids = ownedDogIds;
      }
    }

    const {
      daycare_session,
      pending_service,
      service_dogs,
      breakdown,
      requiresApproval,
    } = await createDaycareSession(payload, server);

    reply.code(201).send({
      daycare_session,
      pending_service,
      service_dogs,
      breakdown,
      requiresApproval,
    });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

// Update a daycare session by ID
export async function modify(req, reply) {
  try {
    const { id } = req.params;
    const session = await updateDaycareSession(id, req.body);
    reply.send({ session });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

// Delete a daycare session by ID
export async function remove(req, reply) {
  try {
    const { id } = req.params;
    await deleteDaycareSession(id);
    reply.code(204).send();
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
