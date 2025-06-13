import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

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

  const requestIds = data.map(req => req.id);
  const dogMap = await getDogIdsForRequests(server, requestIds);

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

// --- Time window validation ---
function validateTimeWindow(window_start, window_end) {
  // Expects "HH:MM" format, 24hr
  if (!window_start || !window_end) return 'window_start and window_end are required.';
  const [startH, startM] = window_start.split(':').map(Number);
  const [endH, endM] = window_end.split(':').map(Number);
  if (
    isNaN(startH) || isNaN(startM) ||
    isNaN(endH) || isNaN(endM)
  ) {
    return 'window_start and window_end must be valid times (HH:MM).';
  }
  if (endH < startH || (endH === startH && endM <= startM)) {
    return 'window_end must be after window_start.';
  }
  return null;
}

// --- Helper: create pending_services row (does NOT store price_preview), but returns it ---
async function createPendingServiceForWalkRequest(server, { user_id, tenant_id, walk_date, dog_ids, window_start, window_end, walk_length_minutes, request_id }) {
  // Insert into pending_services
  const pendingInsert = {
    user_id,
    tenant_id,
    service_date: walk_date,
    service_type: 'walk_window',
    request_id,
    dog_ids,
    details: {
      window_start,
      window_end,
      walk_length_minutes,
    },
    is_confirmed: false,
    created_at: new Date().toISOString(),
  };

  const { data: pendingServiceRows, error: pendingError } = await server.supabase
    .from('pending_services')
    .insert([pendingInsert])
    .select('*');
  if (pendingError) throw pendingError;
  const pendingService = pendingServiceRows[0];

  // Now calculate live price preview (not persisted)
  let pricePreview = null;
  if (pendingService) {
    pricePreview = await previewPrice(
      server,
      'walk_window',
      {
        tenant_id,
        user_id,
        dog_ids,
        walk_length_minutes,
        walk_date,
        window_start,
        window_end,
      }
    );
  }

  // Return enriched response for UI
  return pendingService
    ? { ...pendingService, price_preview: pricePreview }
    : null;
}

export async function createClientWalkRequest(server, payload) {
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

  // --- Time validation ---
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

  // 3. Insert into pending_services and attach price_preview for UI
  const pending_service = await createPendingServiceForWalkRequest(server, {
    user_id,
    tenant_id,
    walk_date,
    dog_ids,
    window_start,
    window_end,
    walk_length_minutes,
    request_id: data.id
  });

  // 4. Return walk request and the new cart row for controller/UI
  return {
    walk_request: {
      ...data,
      dog_ids: dog_ids || [],
    },
    pending_service
  };
}

export async function updateClientWalkRequest(server, userId, id, payload) {
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
