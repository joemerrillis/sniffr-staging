// src/dogVisibility/services/dogVisibilityService.js

export async function getVisibilityByDogId(fastify, dogId) {
  // Try to fetch existing visibility
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .select('dog_id, is_visible')
    .eq('dog_id', dogId)
    .single();

  // If no row exists, initialize default visibility = true
  if (error && error.code === 'PGRST116') {
    const { data: inserted, error: insertError } = await fastify.supabase
      .from('dog_visibility')
      .insert({ dog_id: dogId, is_visible: true })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    return inserted;
  }

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function setVisibilityByDogId(fastify, dogId, isVisible) {
  // Upsert will insert or update the visibility row
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .upsert(
      { dog_id: dogId, is_visible: isVisible },
      { onConflict: 'dog_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
