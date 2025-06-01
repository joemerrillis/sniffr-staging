// src/clientWalkRequests/services/clientWalkRequestsService.js

// Helper to fetch dog_ids for a set of walk request IDs
async function getDogIdsForRequests(server, requestIds) {
  if (!requestIds.length) return {};
  const { data, error } = await server.supabase
    .from('service_dogs')
    .select('service_id, dog_id')
    .eq('service_type', 'client_walk_request')
    .in('service_id', requestIds);
  if (error) throw error;
  // Group by service_id
  const mapping = {};
  for (const row of data) {
    if (!mapping[row.service_id]) mapping[row.service_id] = [];
    mapping[row.service_id].push(row.dog_id);
  }
  return mapping;
}

export async function listClientWalkRequests(server, userId) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .order('walk_date', { ascending: true });
  if (error) throw error;

  // Get all request IDs
  const requestIds = data.map(req => req.id);
  const dogMap = await getDogIdsForRequests(server, requestIds);

  // Attach dog_ids to each request
  return data.map(req => ({
    ...req,
    dog_ids: dogMap[req.id] || [],
  }));
}

export async function getClientWalkRequest(server, userId, id) {
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;

  // Fetch dog_ids for this request
  const { data: dogs, error: dogError } = await server.supabase
    .from('service_dogs')
    .select('dog_id')
    .eq('service_type', 'client_walk_request')
    .eq('service_id', id);
  if (dogError) throw dogError;

  return {
    ...data,
    dog_ids: dogs ? dogs.map(d => d.dog_id) : [],
  };
}

export async function createClientWalkRequest(server, payload) {
  // payload should already have user_id, tenant_id, and dog_ids (array)
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

  // Return with dog_ids array for immediate response
  return {
    ...data,
    dog_ids: dog_ids || [],
  };
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
  // Optionally handle dog_ids update logic here in the future!
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
