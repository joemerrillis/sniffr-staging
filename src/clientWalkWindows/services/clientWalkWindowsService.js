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
/**
 * List all windows “active” during the week starting `weekStart`
 */
export async function listWindowsForWeek(server, userId, weekStart) {
  // 1) compute date boundaries
  const start = new Date(weekStart);
  const end   = new Date(start);
  end.setDate(end.getDate() + 6);

  // 2) fetch all windows for user
  const { data: all, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  // 3) filter by effective date range
  const filtered = all.filter(w => {
    const effStart = new Date(w.effective_start);
    const effEnd   = w.effective_end ? new Date(w.effective_end) : null;
    return effStart <= end && (!effEnd || effEnd >= start);
  });

  return filtered;
}
