// src/daycare_sessions/controllers/daycareSessionsController.js

import {
  listDaycareSessions,
  getDaycareSession,
  updateDaycareSession,
  deleteDaycareSession
} from '../services/daycareSessionsService.js';
import createDaycareSession from '../services/createDaycareSession.js';

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

// Create a new daycare session (with pricing, pending_service, approval check)
export async function create(req, reply) {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const server = req.server;

    // Normalize dog_ids if sent as dog_id
    let payload = { ...req.body, user_id };
    if (payload.dog_id && !payload.dog_ids) {
      payload.dog_ids = [payload.dog_id];
    }

    const {
      daycare_session,
      pending_service,
      breakdown,
      requiresApproval,
    } = await createDaycareSession(server, payload);

    reply.code(201).send({
      daycare_session,
      pending_service,
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
