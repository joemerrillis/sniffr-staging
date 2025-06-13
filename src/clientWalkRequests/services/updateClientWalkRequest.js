// src/clientWalkRequests/services/updateClientWalkRequest.js
import { log } from './logger.js';

export default async function updateClientWalkRequest(server, userId, id, payload) {
  const { dog_ids, ...rest } = payload;
  // 1. Update the main walk request fields
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .update(rest)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;

  // 2. If dog_ids provided, update service_dogs
  if (Array.isArray(dog_ids)) {
    await server.supabase
      .from('service_dogs')
      .delete()
      .eq('service_type', 'client_walk_request')
      .eq('service_id', id);

    if (dog_ids.length) {
      const dogRows = dog_ids.map(dog_id => ({
        service_type: 'client_walk_request',
        service_id: id,
        dog_id,
      }));
      const { error: dogError } = await server.supabase
        .from('service_dogs')
        .insert(dogRows);
      if (dogError) throw dogError;
    }
  }

  // 3. Fetch latest dog_ids for this request (for output)
  const { data: dogs, error: dogErr } = await server.supabase
    .from('service_dogs')
    .select('dog_id')
    .eq('service_type', 'client_walk_request')
    .eq('service_id', id);
  if (dogErr) throw dogErr;

  log('Updated client_walk_request:', data);
  return {
    ...data,
    dog_ids: dogs ? dogs.map(d => d.dog_id) : [],
  };
}
