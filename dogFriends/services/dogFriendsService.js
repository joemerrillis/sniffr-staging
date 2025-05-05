export async function listFriendships(fastify, dogId) {
  const q = fastify.supabase.from('dog_friends').select('*');
  if (dogId) q.eq('dog_id', dogId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export async function getFriendship(fastify, id) {
  const { data, error } = await fastify.supabase
    .from('dog_friends')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createFriendship(fastify, { dog_id, friend_dog_id }) {
  const { data, error } = await fastify.supabase
    .from('dog_friends')
    .insert({ dog_id, friend_dog_id, status: 'requested' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateFriendship(fastify, id, payload) {
  const { data, error } = await fastify.supabase
    .from('dog_friends')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFriendship(fastify, id) {
  const { error } = await fastify.supabase
    .from('dog_friends')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
