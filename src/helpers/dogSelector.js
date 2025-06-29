// src/helpers/dogSelector.js

/**
 * Helper to get dog_ids for a service.
 * @param {object} params - { user_id, supabase, explicitDogIds }
 * @returns {Promise<string[]>} Array of dog IDs
 * @throws if zero or multiple dogs and no explicitDogIds
 */
export async function getDogIdsForRequest({ user_id, supabase, explicitDogIds }) {
  // 1. If explicit dog_ids provided, use them
  if (explicitDogIds && explicitDogIds.length > 0) {
    return Array.isArray(explicitDogIds) ? explicitDogIds : [explicitDogIds];
  }

  // 2. Else, look up all dogs for user in dog_owners table
  const { data: dogOwnerRows, error } = await supabase
    .from('dog_owners')
    .select('dog_id')
    .eq('user_id', user_id);

  if (error) {
    console.error('[getDogIdsForRequest] Error looking up dog_owners:', error);
    throw new Error('Failed to look up dogs for user');
  }

  const dogIds = dogOwnerRows ? dogOwnerRows.map(r => r.dog_id) : [];

  // 3. If none, throw error
  if (!dogIds.length) {
    throw new Error('No dogs found for user. User must add a dog before booking.');
  }

  // 4. If only one, use it
  if (dogIds.length === 1) {
    return dogIds;
  }

  // 5. If multiple, throw error (force UI to select)
  throw new Error('Multiple dogs found. Please specify which dog(s) this service is for.');
}
