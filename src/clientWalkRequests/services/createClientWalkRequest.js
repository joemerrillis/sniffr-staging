// src/clientWalkRequests/services/createClientWalkRequest.js
import createPendingServiceForWalkRequest from './createPendingServiceForWalkRequest.js';
import { validateTimeWindow } from './validateTimeWindow.js';
import { log } from './logger.js';

export default async function createClientWalkRequest(server, payload) {
  const {
    dog_ids,
    window_start,
    window_end,
    walk_date,
    walk_length_minutes,
    user_id,
    tenant_id,
    ...rest
  } = payload;

  // Validate window times
  const windowErr = validateTimeWindow(window_start, window_end);
  if (windowErr) throw new Error(windowErr);

  // 1. Insert client_walk_request
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .insert({
      user_id,
      tenant_id,
      walk_date,
      window_start,
      window_end,
      walk_length_minutes,
      ...rest
    })
    .select('*')
    .single();
  if (error) throw error;

  // 2. Insert service_dogs for each dog
  if (Array.isArray(dog_ids) && dog_ids.length) {
    const dogRows = dog_ids.map(dog_id => ({
      service_type: 'client_walk_request',
      service_id: data.id,
      dog_id,
    }));
    const { error: dogError } = await server.supabase
      .from('service_dogs')
      .insert(dogRows);
    if (dogError) throw dogError;
  }

  // 3. Insert into pending_services and attach price_preview for UI
  const pending_service = await createPendingServiceForWalkRequest(server, {
    user_id,
    tenant_id,
    walk_date,
    dog_ids,
    window_start,
    window_end,
    walk_length_minutes,
    request_id: data.id,
  });

  log('Created client_walk_request:', data);
  return {
    walk_request: {
      ...data,
      dog_ids: dog_ids || [],
    },
    pending_service
  };
}
