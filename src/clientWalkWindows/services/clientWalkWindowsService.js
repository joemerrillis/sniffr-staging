// src/clientWalkWindows/services/clientWalkWindowsService.js

const TABLE = 'client_walk_windows';

/**
 * List all windows for a given user
 */
export async function listClientWalkWindows(server, userId) {
  const { data, error } = await server.supabase
    .from(TABLE)
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
    .from(TABLE)
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
    .from(TABLE)
    .insert([payload])
    .select('*') // ensure full row returned
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update a window for a given user
 */
export async function updateClientWalkWindow(server, userId, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload)
    .select('*') // ensure full updated row returned
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
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
