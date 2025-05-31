// src/clientWalkRequests/services/clientWalkRequestsService.js

export async function listClientWalkRequests(server, userId) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .order('walk_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getClientWalkRequest(server, userId, id) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createClientWalkRequest(server, payload) {
  // payload should already have user_id and tenant_id set
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateClientWalkRequest(server, userId, id, payload) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .update(payload)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClientWalkRequest(server, userId, id) {
  const { error } = await server.supabase
    .from('client_walk_requests')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
