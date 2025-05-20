// src/boardings/services/boardingsService.js

const TABLE = 'boardings';

export async function listBoardings(server, tenant_id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('tenant_id', tenant_id);
  if (error) throw error;
  return data;
}

export async function getBoarding(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createBoarding(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload])
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateBoarding(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBoarding(server, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
