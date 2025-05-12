// src/dogs/services/dogsService.js

const TABLE = 'dogs';

export async function listDogs(server) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*');
  if (error) throw error;
  return data;
}

export async function getDog(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createDog(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload])
    .select('*')             // ensure full row returned
    .single();
  if (error) throw error;
  return data;
}

export async function updateDog(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDog(server, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
