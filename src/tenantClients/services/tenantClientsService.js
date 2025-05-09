const TABLE = 'tenant_clients';

export async function listTenantClients(server) {
  const { data, error } = await server.supabase.from(TABLE).select('*');
  if (error) throw error;
  return data;
}

export async function getTenantClient(server, id) {
  const { data, error } = await server.supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createTenantClient(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload], { returning: 'representation' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateTenantClient(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload, { returning: 'representation' })
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTenantClient(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .delete({ returning: 'representation' })
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
