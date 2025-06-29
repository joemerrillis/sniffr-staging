import { previewPrice } from '../../pricingRules/services/pricingEngine.js';
import createPendingServiceForWalkRequest from './createPendingServiceForWalkRequest.js';
import { validateTimeWindow } from './validateTimeWindow.js';
import { log } from './logger.js';
import { getDogIdsForRequest } from '../../helpers/dogSelector.js'; // <-- New import

// Helper to fetch the actual pending_service row
async function getPendingServiceByRequestId(server, request_id) {
  log('[getPendingServiceByRequestId] Looking up pending_service for request_id:', request_id);
  const { data, error } = await server.supabase
    .from('pending_services')
    .select('*')
    .eq('request_id', request_id)
    .maybeSingle();
  if (error) {
    log('[getPendingServiceByRequestId] ERROR:', error);
    throw error;
  }
  log('[getPendingServiceByRequestId] Result:', data);
  return data;
}

export default async function createClientWalkRequest(server, payload) {
  log('[createClientWalkRequest] START payload:', payload);

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
  log('[createClientWalkRequest] Validating window:', window_start, window_end);
  const windowErr = validateTimeWindow(window_start, window_end);
  if (windowErr) {
    log('[createClientWalkRequest] Invalid window:', windowErr);
    throw new Error(windowErr);
  }

  // 1. Insert client_walk_request
  log('[createClientWalkRequest] Inserting client_walk_request:', {
    user_id,
    tenant_id,
    walk_date,
    window_start,
    window_end,
    walk_length_minutes,
    ...rest
  });
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
  if (error) {
    log('[createClientWalkRequest] ERROR inserting client_walk_request:', error);
    throw error;
  }
  log('[createClientWalkRequest] Inserted client_walk_request:', data);

  // --- New: Use helper to get correct dog_ids ---
  let resolvedDogIds = [];
  try {
    resolvedDogIds = await getDogIdsForRequest({
      user_id,
      supabase: server.supabase,
      explicitDogIds: dog_ids,
    });
  } catch (err) {
    log('[createClientWalkRequest] ERROR resolving dog_ids:', err);
    throw err;
  }

  // Insert into service_dogs
  let service_dogs = [];
  if (resolvedDogIds.length) {
    const dogRows = resolvedDogIds.map(dog_id => ({
      service_type: 'client_walk_request',
      service_id: data.id,
      dog_id,
    }));
    log('[createClientWalkRequest] Inserting service_dogs:', dogRows);
    const { data: insertedDogs, error: dogError } = await server.supabase
      .from('service_dogs')
      .insert(dogRows)
      .select('*');
    if (dogError) {
      log('[createClientWalkRequest] ERROR inserting service_dogs:', dogError);
      throw dogError;
    }
    log('[createClientWalkRequest] Inserted service_dogs:', insertedDogs);
    service_dogs = insertedDogs || [];
  } else {
    log('[createClientWalkRequest] No dog_ids to insert into service_dogs.');
  }

  // 3. Get price estimate using previewPrice
  let price_preview = null;
  if (tenant_id) {
    log('[createClientWalkRequest] Fetching price_preview with:', {
      tenant_id,
      walk_length_minutes,
      dog_ids: resolvedDogIds || [],
    });
    try {
      price_preview = await previewPrice(server, 'walk_window', {
        tenant_id,
        walk_length_minutes,
        dog_ids: resolvedDogIds || [],
      });
      log('[createClientWalkRequest] Got price_preview:', price_preview);
    } catch (err) {
      log('[createClientWalkRequest] ERROR in previewPrice:', err);
    }
  } else {
    log('[createClientWalkRequest] No tenant_id; skipping price preview.');
  }

  // 4. Actually insert the pending_service!
  log('[createClientWalkRequest] About to call createPendingServiceForWalkRequest');
  await createPendingServiceForWalkRequest(server, {
    user_id,
    tenant_id,
    walk_date,
    dog_ids: resolvedDogIds,
    window_start,
    window_end,
    walk_length_minutes,
    request_id: data.id
  });

  // 5. Try to fetch pending_service row by request_id (cart row for UI)
  let pending_service = null;
  try {
    log('[createClientWalkRequest] About to fetch pending_service by request_id:', data.id);
    pending_service = await getPendingServiceByRequestId(server, data.id);
    log('[createClientWalkRequest] Got pending_service:', pending_service);
  } catch (err) {
    log('[createClientWalkRequest] ERROR fetching pending_service:', err, 'request_id:', data.id);
  }

  log('[createClientWalkRequest] FINAL RESPONSE:', {
    walk_request: {
      ...data,
      dog_ids: resolvedDogIds || [],
      price_preview,
    },
    pending_service
  });

  return {
    walk_request: {
      ...data,
      dog_ids: resolvedDogIds || [],
      price_preview, // Attach price here for parity with windows flow
    },
    pending_service,
    service_dogs,
    price_preview
  };
}
