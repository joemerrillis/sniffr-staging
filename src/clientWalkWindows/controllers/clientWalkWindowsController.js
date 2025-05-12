import {
  listWindows as listService,
  getWindow as getService,
  createWindow as createService,
  updateWindow as updateService,
  deleteWindow as deleteService
} from '../services/clientWalkWindowsService.js';

export async function listWindows(request, reply) {
  const data = await listService(request.server, request.user.userId);
  reply.send(data);
}

export async function getWindow(request, reply) {
  const { id } = request.params;
  const rec = await getService(request.server, request.user.userId, id);
  if (!rec) return reply.code(404).send({ error: 'Window not found' });
  reply.send(rec);
}

export async function createWindow(request, reply) {
  const payload = { ...request.body, user_id: request.user.userId };
  const rec = await createService(request.server, payload);
  reply.code(201).send(rec);
}

export async function updateWindow(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  const rec = await updateService(request.server, request.user.userId, id, payload);
  if (!rec) return reply.code(404).send({ error: 'Window not found' });
  reply.send(rec);
}

export async function deleteWindow(request, reply) {
  const { id } = request.params;
  await deleteService(request.server, request.user.userId, id);
  reply.code(204).send();
}
