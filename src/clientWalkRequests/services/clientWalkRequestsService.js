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
  const { dog_ids, window_start, window_end, walk_date, user_id, ...rest } = payload;
  // 1. Insert client_walk_request
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .insert({
      user_id,
      walk_date,
      window_start,
      window_end,
      ...rest
    })
    .select('*')
    .single();
  if (error) throw error;

  // 2. Insert a row in service_dogs for each dog
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

  // 3. Insert into pending_services (the cart) for immediate UI update
  const pendingInsert = {
    user_id,
    service_date: walk_date,
    service_type: 'walk',
    request_id: data.id,
    dog_ids,
    details: {
      window_start,
      window_end,
    },
    is_confirmed: false,
  };

  const { data: pendingServiceRows, error: pendingError } = await server.supabase
    .from('pending_services')
    .insert([pendingInsert])
    .select('*');

  if (pendingError) throw pendingError;

  // 4. Return walk request and the new cart row for controller/UI
  return {
    walk_request: {
      ...data,
      dog_ids: dog_ids || [],
    },
    pending_service: pendingServiceRows[0] || null,
  };
}

export async function updateClientWalkRequest(server, userId, id, payload) {
  // Separate out dog_ids if present
  const { dog_ids, ...rest } = payload;

  // 1. Update the main walk request fields (if any)
  const { data, error } = await server.supabase
    .from('client_walk_requests')
    .update(rest)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;

  // 2. If dog_ids array provided, update service_dogs entries
  if (Array.isArray(dog_ids)) {
    // a) Delete existing entries for this request
    const { error: delErr } = await server.supabase
      .from('service_dogs')
      .delete()
      .eq('service_type', 'client_walk_request')
      .eq('service_id', id);
    if (delErr) throw delErr;

    // b) Insert new dog_ids
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

  return {
    ...data,
    dog_ids: dogs ? dogs.map(d => d.dog_id) : [],
  };
}

export async function deleteClientWalkRequest(server, userId, id) {
  const { error } = await server.supabase
    .from('client_walk_requests')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
