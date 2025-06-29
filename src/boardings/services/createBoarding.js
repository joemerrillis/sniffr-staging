// src/boardings/services/createBoarding.js

import { getDogIdsForRequest } from '../../helpers/dogSelector.js';

const TABLE = 'boardings';

export async function createBoarding(server, payload) {
  const { dogs, user_id, tenant_id, ...rest } = payload;

  // Normalize: if dogs is an array of objects or UUIDs, flatten to array of strings
  const explicitDogIds = Array.isArray(dogs)
    ? dogs.map(d => typeof d === 'string' ? d : d.dog_id)
    : [];

  // 1. Insert the boarding record
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert({
      user_id,
      tenant_id,
      ...rest
    })
    .select('*')
    .single();
  if (error) throw new Error(`[createBoarding] Error inserting boarding: ${error.message}`);

  // 2. Use the helper to resolve dog_ids (either from request or fallback)
  let resolvedDogIds = [];
  try {
    resolvedDogIds = await getDogIdsForRequest({
      user_id,
      supabase: server.supabase,
      explicitDogIds,
    });
  } catch (err) {
    throw new Error(`[createBoarding] Error resolving dog_ids: ${err.message}`);
  }

  // 3. Insert service_dogs entries
  let insertedDogs = [];
  if (resolvedDogIds.length) {
    const dogRows = resolvedDogIds.map(dog_id => ({
      service_type: 'boarding',
      service_id: data.id,
      dog_id,
    }));
    const { data: inserted, error: dogError } = await server.supabase
      .from('service_dogs')
      .insert(dogRows)
      .select('*');
    if (dogError) {
      // Optional: Roll back the boarding insert if this fails (advanced, not included here)
      throw new Error(`[createBoarding] Error inserting service_dogs: ${dogError.message}`);
    }
    insertedDogs = inserted;
  }

  // 4. Return the normalized result
  return {
    boarding: {
      ...data,
      dogs: resolvedDogIds,
    },
    service_dogs: insertedDogs,
  };
}
