// src/clientWalkWindows/services/clientWalkWindowsService.js
export async function listClientWalkWindows(server) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('*');
  if (error) throw error;
  return data;
}

export async function getClientWalkWindow(server, id) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createClientWalkWindow(server, payload) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .insert(payload)
    .single();
  if (error) throw error;
  return data;
}

export async function updateClientWalkWindow(server, id, payload) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .update(payload)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClientWalkWindow(server, id) {
  const { error } = await server.supabase
    .from('client_walk_windows')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
