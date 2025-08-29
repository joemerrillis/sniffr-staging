import {
  listWalks as   listService,
  getWalk as     getService,
  listWalksByDay as listDayService,
  createWalk as  createService,
  updateWalk as  updateService,
  deleteWalk as  deleteService,
  confirmWalksByDay as confirmService,
  cloneWeekWalks as cloneService
} from '../services/walksService.js';

export async function listWalks(request, reply) {
  const data = await listService(request.server);
  reply.send(data);
}

export async function getWalk(request, reply) {
  const { id } = request.params;
  const rec = await getService(request.server, id);
  if (!rec) return reply.code(404).send({ error: 'Walk not found' });
  reply.send(rec);
}

export async function listWalksByDay(request, reply) {
  const { date, fallback_last_week } = request.query;
  const data = await listDayService(request.server, date, fallback_last_week);
  reply.send(data);
}

export async function createWalk(request, reply) {
  // Allow client_id to come from authenticated user if not in body
  const payload = { ...request.body };
  if (!payload.client_id && request.user && request.user.userId) {
    payload.client_id = request.user.userId;
  }
  const rec = await createService(request.server, payload);
  reply.code(201).send(rec);
}

export async function updateWalk(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  const rec = await updateService(request.server, id, payload);
  if (!rec) return reply.code(404).send({ error: 'Walk not found' });
  reply.send(rec);
}

export async function deleteWalk(request, reply) {
  const { id } = request.params;
  await deleteService(request.server, id);
  reply.code(204).send();
}

export async function confirmDay(request, reply) {
  const { date } = request.body;
  const count = await confirmService(request.server, date);
  reply.send({ confirmed: count });
}

export async function cloneWeek(request, reply) {
  const { from_week_start, to_week_start } = request.body;
  const recs = await cloneService(request.server, from_week_start, to_week_start);
  reply.code(201).send(recs);
}
