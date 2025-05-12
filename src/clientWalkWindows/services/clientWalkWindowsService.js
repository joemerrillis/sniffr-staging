// src/clientWalkWindows/services/clientWalkWindowsService.js

export async function listClientWalkWindows(server, clientId) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('*')
    .eq('client_id', clientId);
  if (error) throw error;
  return data;
}

export async function getClientWalkWindow(server, clientId, id) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('*')
    .eq('client_id', clientId)
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

export async function updateClientWalkWindow(server, clientId, id, payload) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .update(payload)
    .eq('client_id', clientId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClientWalkWindow(server, clientId, id) {
  const { error } = await server.supabase
    .from('client_walk_windows')
    .delete()
    .eq('client_id', clientId)
    .eq('id', id);
  if (error) throw error;
}
