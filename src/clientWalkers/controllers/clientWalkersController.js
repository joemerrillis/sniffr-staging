import {
  listClientWalkers,
  getClientWalker,
  createClientWalker,
  updateClientWalker,
  deleteClientWalker
} from '../services/clientWalkersService.js';

export async function list(request, reply) {
  const data = await listClientWalkers(request.server);
  reply.send(data);
}

export async function get(request, reply) {
  const { id } = request.params;
  const record = await getClientWalker(request.server, id);
  if (!record) {
    return reply.code(404).send({ error: 'ClientWalker not found' });
  }
  reply.send(record);
}

export async function create(request, reply) {
  const payload = request.body;
  const record = await createClientWalker(request.server, payload);
  reply.code(201).send(record);
}

export async function update(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  const record = await updateClientWalker(request.server, id, payload);
  if (!record) {
    return reply.code(404).send({ error: 'ClientWalker not found' });
  }
  reply.send(record);
}

export async function remove(request, reply) {
  const { id } = request.params;
  await deleteClientWalker(request.server, id);
  reply.code(204).send();
}
