// src/clientWalkRequests/services/clientWalkRequestsService.js

export async function listClientWalkRequests(server, userId) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .order('walk_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getClientWalkRequest(server, userId, id) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createClientWalkRequest(server, payload) {
  // payload should already have user_id, tenant_id, and dog_ids (array)
  // We'll remove dog_ids from the payload for the main insert, then handle service_dogs
  const { dog_ids, ...rest } = payload;
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .insert(rest)
    .select('*')
    .single();
  if (error) throw error;

  // Insert a row in service_dogs for each dog
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

  return data;
}

export async function updateClientWalkRequest(server, userId, id, payload) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .update(payload)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClientWalkRequest(server, userId, id) {
  const { error } = await server.supabase
    .from('client_walk_requests')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
