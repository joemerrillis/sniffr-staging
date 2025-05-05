// src/tenants/controllers/tenantsController.js

import {
  listTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant
} from '../services/tenantsService.js';

export async function list(request, reply) {
  const tenants = await listTenants(request.server);
  return { tenants };
}

export async function retrieve(request, reply) {
  const { id } = request.params;
  try {
    const tenant = await getTenantById(request.server, id);
    return { tenant };
  } catch (err) {
    return reply.code(404).send({ error: 'Tenant not found' });
  }
}

export async function create(request, reply) {
  const payload = request.body;
  // 1) create the tenant record
  const tenant = await createTenant(request.server, payload);

  // 2) auto‐add the creator as the primary “walker” (employee)
  try {
    const userId = request.user.userId; // injected by your auth plugin
    await request.server.supabase
      .from('employees')
      .insert([{ tenant_id: tenant.id, user_id: userId, is_primary: true }]);
  } catch (err) {
    // log, but don’t block tenant creation
    request.server.log.error(
      'Failed to auto-assign initial employee for tenant',
      err
    );
  }

  reply.code(201).send({ tenant });
}

export async function modify(request, reply) {
  const { id } = request.params;
  const payload = request.body;
  try {
    const tenant = await updateTenant(request.server, id, payload);
    return { tenant };
  } catch (err) {
    return reply.code(404).send({ error: 'Tenant not found' });
  }
}

export async function remove(request, reply) {
  const { id } = request.params;
  try {
    await deleteTenant(request.server, id);
    reply.code(204).send();
  } catch (err) {
    reply.code(404).send({ error: 'Tenant not found' });
  }
}
