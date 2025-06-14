// src/daycare_sessions/controllers/daycareSessionsController.js

import {
  listDaycareSessions,
  getDaycareSession,
  createDaycareSession,
  updateDaycareSession,
  deleteDaycareSession
} from '../services/daycareSessionsService.js';

export async function list(req, reply) {
  try {
    const filters = req.query;
    const sessions = await listDaycareSessions(filters);
    reply.send({ sessions });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

export async function retrieve(req, reply) {
  try {
    const { id } = req.params;
    const session = await getDaycareSession(id);
    reply.send({ session });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

export async function create(req, reply) {
  try {
    const user_id = req.user?.id || req.body.user_id;
    const server = req.server;
    const payload = { ...req.body, user_id };

    const { daycare_session, pending_service, breakdown, requiresApproval } =
      await createDaycareSession(payload, server);

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

export async function modify(req, reply) {
  try {
    const { id } = req.params;
    const session = await updateDaycareSession(id, req.body);
    reply.send({ session });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

export async function remove(req, reply) {
  try {
    const { id } = req.params;
    await deleteDaycareSession(id);
    reply.code(204).send();
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
