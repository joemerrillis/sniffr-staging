import {
  listDaycareSessions,
  getDaycareSession,
  createDaycareSession,
  updateDaycareSession,
  deleteDaycareSession
} from '../services/daycareSessionsService.js';

export async function list(req, reply) {
  const filters = req.query;
  const sessions = await listDaycareSessions(filters);
  reply.send({ sessions });
}

export async function retrieve(req, reply) {
  const { id } = req.params;
  const session = await getDaycareSession(id);
  reply.send({ session });
}

export async function create(req, reply) {
  const session = await createDaycareSession(req.body);
  reply.code(201).send({ session });
}

export async function modify(req, reply) {
  const { id } = req.params;
  const session = await updateDaycareSession(id, req.body);
  reply.send({ session });
}

export async function remove(req, reply) {
  const { id } = req.params;
  await deleteDaycareSession(id);
  reply.code(204).send();
}
