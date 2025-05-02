export async function getVisibilityByDogId(fastify, dogId) {
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .select('dog_id, is_visible')
    .eq('dog_id', dogId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setVisibilityByDogId(fastify, dogId, isVisible) {
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .update({ is_visible: isVisible })
    .eq('dog_id', dogId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}