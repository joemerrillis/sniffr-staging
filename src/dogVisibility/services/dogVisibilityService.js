// src/dogVisibility/services/dogVisibilityService.js

/**
 * Create the visibility row for a dog.
 */
export async function createVisibilityForDogId(fastify, dogId, isVisible) {
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .insert({ dog_id: dogId, is_visible: isVisible })
    .select('dog_id, is_visible')
    .single();

  if (error) {
    throw new Error(`Could not create visibility: ${error.message}`);
  }

  return data;
}

/**
 * Fetch the visibility row for this dog.
 * Throws if none exists.
 */
export async function getVisibilityByDogId(fastify, dogId) {
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .select('dog_id, is_visible')
    .eq('dog_id', dogId)
    .single();

  if (error) {
    throw new Error(`Visibility not set for dog ${dogId}`);
  }

  return data;
}

/**
 * Set (or insert) the visibility value for this dog.
 */
export async function setVisibilityByDogId(fastify, dogId, isVisible) {
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .upsert(
      { dog_id: dogId, is_visible: isVisible },
      { onConflict: 'dog_id' }
    )
    .select('dog_id, is_visible')
    .single();

  if (error) {
    throw new Error(`Could not set visibility: ${error.message}`);
  }

  return data;
}

/**
 * Delete the visibility record for this dog.
 */
export async function deleteVisibilityByDogId(fastify, dogId) {
  const { error } = await fastify.supabase
    .from('dog_visibility')
    .delete()
    .eq('dog_id', dogId);

  if (error) {
    throw new Error(`Could not delete visibility: ${error.message}`);
  }
}
