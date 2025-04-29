import {
  listTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant
} from '../services/tenantsService.js';

export async function list(request, reply) {
  const tenants = await listTenants(request.server);
  reply.send({ tenants });
}

export async function retrieve(request, reply) {
  const tenant = await getTenantById(request.server, request.params.id);
  reply.send({ tenant });
}

export async function create(request, reply) {
  const tenant = await createTenant(request.server, request.body);
  reply.code(201).send({ tenant });
}

export async function modify(request, reply) {
  const tenant = await updateTenant(request.server, request.params.id, request.body);
  reply.send({ tenant });
}

export async function remove(request, reply) {
  await deleteTenant(request.server, request.params.id);
  reply.code(204).send();
}