// src/clientWalkWindows/services/createClientWalkWindow.js

import { getDogIdsForRequest } from '../../helpers/dogSelector.js';

export async function createClientWalkWindow(server, payload) {
  const { dog_ids, user_id, tenant_id, ...rest } = payload;

  // 1. Insert the walk window record
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .insert({
      user_id,
      tenant_id,
      ...rest
    })
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .single();
  if (error) throw error;

  // 2. Resolve dogs: prefer UI input, else auto-lookup
  let resolvedDogIds = [];
  try {
    resolvedDogIds = await getDogIdsForRequest({
      user_id,
      supabase: server.supabase,
      explicitDogIds: dog_ids,
    });
  } catch (e) {
    // Optionally handle/log, but usually best to let the error propagate
    throw e;
  }

  // 3. Insert into service_dogs
  let insertedDogs = [];
  if (resolvedDogIds.length) {
    const dogRows = resolvedDogIds.map(dog_id => ({
      service_type: 'client_walk_window',
      service_id: data.id,
      dog_id,
    }));
    const { data: inserted, error: dogError } = await server.supabase
      .from('service_dogs')
      .insert(dogRows)
      .select('*');
    if (dogError) throw dogError;
    insertedDogs = inserted;
  }

  // 4. Return combined info
  return {
    walk_window: {
      ...data,
      dog_ids: resolvedDogIds,
    },
    service_dogs: insertedDogs,
  };
}
