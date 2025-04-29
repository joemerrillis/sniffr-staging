export async function listTenants(fastify) {
  const { data, error } = await fastify.supabase
    .from('tenants')
    .select('*');
  if (error) throw new Error(error.message);
  return data;
}

export async function getTenantById(fastify, id) {
  const { data, error } = await fastify.supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createTenant(fastify, payload) {
  const { data, error } = await fastify.supabase
    .from('tenants')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTenant(fastify, id, updates) {
  const { data, error } = await fastify.supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTenant(fastify, id) {
  const { error } = await fastify.supabase
    .from('tenants')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}