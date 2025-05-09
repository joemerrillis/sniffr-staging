import {
  listTenantClients,
  getTenantClient,
  createTenantClient,
  updateTenantClient,
  deleteTenantClient
} from '../services/tenantClientsService.js';

export async function list(request, reply) {
  const data = await listTenantClients(request.server);
  reply.send(data);
}

export async function get(request, reply) {
  const { id } = request.params;
  const record = await getTenantClient(request.server, id);
  if (!record) {
    return reply.code(404).send({ error: 'TenantClient not found' });
  }
  reply.send(record);
}

export async function create(request, reply) {
  const payload = request.body;
  const record = await createTenantClient(request.server, payload);
  reply.code(201).send(record);
}

export async function update(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  const record = await updateTenantClient(request.server, id, payload);
  if (!record) {
    return reply.code(404).send({ error: 'TenantClient not found' });
  }
  reply.send(record);
}

export async function remove(request, reply) {
  const { id } = request.params;
  await deleteTenantClient(request.server, id);
  reply.code(204).send();
}
