// src/clientWalkWindows/services/clientWalkWindowsService.js

/**
 * List all windows for a given user
 */
export async function listClientWalkWindows(server, userId) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

/**
 * Get a single window by user + ID
 */
export async function getClientWalkWindow(server, userId, id) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a new window
 */
export async function createClientWalkWindow(server, payload) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .insert(payload)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update a window for a given user
 */
export async function updateClientWalkWindow(server, userId, id, payload) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .update(payload)
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a window for a given user
 */
export async function deleteClientWalkWindow(server, userId, id) {
  const { error } = await server.supabase
    .from('client_walk_windows')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
