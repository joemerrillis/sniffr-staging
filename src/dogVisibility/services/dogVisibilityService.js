// src/dogVisibility/services/dogVisibilityService.js

/**
 * Ensure a visibility row exists for this dog (default = true),
 * then fetch & return it.
 */
export async function getVisibilityByDogId(fastify, dogId) {
  // Upsert a default row if missing; onConflict do nothing if exists
  const { error: upsertErr } = await fastify.supabase
    .from('dog_visibility')
    .upsert(
      { dog_id: dogId, is_visible: true },
      { onConflict: 'dog_id', ignoreDuplicates: true }
    );

  if (upsertErr) {
    throw new Error(`Could not initialize visibility: ${upsertErr.message}`);
  }

  // Now select the (new-or-existing) row
  const { data, error } = await fastify.supabase
    .from('dog_visibility')
    .select('dog_id, is_visible')
    .eq('dog_id', dogId)
    .single();

  if (error) {
    throw new Error(`Could not fetch visibility: ${error.message}`);
  }

  return data;
}

/**
 * Set (or insert) the visibility value for this dog.
 */
export async function setVisibilityByDogId(fastify, dogId, isVisible) {
  // Upsert will insert or update
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
