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
  // 1) Create the tenant record
  const tenant = await createTenant(request.server, request.body);

  // 2) Auto-add the creator as the primary “walker” (employee)
  let seededEmployee = null;
  try {
    const userId = request.user.userId; // from your auth plugin
    const { data: employee, error: empErr } = await request.server.supabase
      .from('employees')
      .insert(
        [{
          tenant_id:  tenant.id,
          user_id:    userId,
          is_primary: true
        }],
        { returning: 'representation' }
      )
      .select('*')
      .single();

    if (empErr) {
      throw empErr;
    }

    seededEmployee = employee;
    request.server.log.info({ employee }, 'Seeded initial employee');
  } catch (err) {
    request.server.log.error(
      'Failed to auto-assign initial employee for tenant:',
      err
    );
  }

  // 3) Return the created tenant (and employee if you want to surface it)
  reply.code(201).send({
    tenant,
    employee: seededEmployee
  });
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
