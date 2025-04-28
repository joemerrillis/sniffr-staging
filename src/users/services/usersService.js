export async function listUsers(fastify) {
  const { data, error } = await fastify.supabase
    .from('users')
    .select('id, tenant_id, email, name, role, created_at');
  if (error) throw new Error(error.message);
  return data;
}

export async function getUserById(fastify, id) {
  const { data, error } = await fastify.supabase
    .from('users')
    .select('id, tenant_id, email, name, role, created_at')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateUser(fastify, id, updates) {
  const { data, error } = await fastify.supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteUser(fastify, id) {
  const { error } = await fastify.supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return;
}