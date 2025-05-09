const TABLE = 'client_walkers';

export async function listClientWalkers(server) {
  const { data, error } = await server.supabase.from(TABLE).select('*');
  if (error) throw error;
  return data;
}

export async function getClientWalker(server, id) {
  const { data, error } = await server.supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createClientWalker(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload], { returning: 'representation' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateClientWalker(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload, { returning: 'representation' })
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClientWalker(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .delete({ returning: 'representation' })
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
