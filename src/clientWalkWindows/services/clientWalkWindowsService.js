// src/clientWalkWindows/services/clientWalkWindowsService.js

const TABLE = 'client_walk_windows';

export async function listWindows(server, userId) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function getWindow(server, userId, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) {
    return null;
  }
  return data;
}

export async function createWindow(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload], { returning: 'representation' })
    .single();
  if (error) throw error;
  return data;
}

export async function updateWindow(server, userId, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload, { returning: 'representation' })
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function deleteWindow(server, userId, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
