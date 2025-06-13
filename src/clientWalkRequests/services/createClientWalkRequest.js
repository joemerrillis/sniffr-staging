import { previewPrice } from '../../pricingRules/services/pricingEngine.js';
import createPendingServiceForWalkRequest from './createPendingServiceForWalkRequest.js';
import { validateTimeWindow } from './validateTimeWindow.js';
import { log } from './logger.js';

// Helper to fetch the actual pending_service row
async function getPendingServiceByRequestId(server, request_id) {
  const { data, error } = await server.supabase
    .from('pending_services')
    .select('*')
    .eq('request_id', request_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

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

  // 3. Get price estimate using previewPrice
  let price_preview = null;
  if (tenant_id) {
    price_preview = await previewPrice(server, 'walk_window', {
      tenant_id,
      walk_length_minutes,
      dog_ids: dog_ids || [],
    });
  }

  // 4. Try to fetch pending_service row by request_id (cart row for UI)
  let pending_service = null;
  try {
    pending_service = await getPendingServiceByRequestId(server, data.id);
  } catch (err) {
    // Optionally: log and continue (don't crash on missing pending_service)
    log('Pending_service not found for request_id:', data.id);
  }

  log('Created client_walk_request:', data);

  return {
    walk_request: {
      ...data,
      dog_ids: dog_ids || [],
      price_preview, // Attach price here for parity with windows flow
    },
    pending_service
  };
}
