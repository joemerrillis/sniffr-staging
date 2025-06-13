// src/clientWalkRequests/services/createPendingServiceForWalkRequest.js
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';
import { log } from './logger.js';

export default async function createPendingServiceForWalkRequest(
  server,
  { user_id, tenant_id, walk_date, dog_ids, window_start, window_end, walk_length_minutes, request_id }
) {
  log('[createPendingServiceForWalkRequest] INPUT:', {
    user_id, tenant_id, walk_date, dog_ids, window_start, window_end, walk_length_minutes, request_id
  });

  const pendingInsert = {
    user_id,
    tenant_id,
    service_date: walk_date,
    service_type: 'walk_window', // ensure this matches your rules!
    request_id,
    dog_ids,
    details: { window_start, window_end, walk_length_minutes },
    is_confirmed: false,
    created_at: new Date().toISOString(),
  };

  log('[createPendingServiceForWalkRequest] About to insert into pending_services:', pendingInsert);

  const { data: pendingServiceRows, error: pendingError } = await server.supabase
    .from('pending_services')
    .insert([pendingInsert])
    .select('*');

  if (pendingError) {
    log('[createPendingServiceForWalkRequest] ERROR inserting pending_service:', pendingError);
    throw pendingError;
  }

  if (!pendingServiceRows || !pendingServiceRows.length) {
    log('[createPendingServiceForWalkRequest] WARNING: Inserted but no rows returned.', pendingInsert);
    return null;
  }

  const pendingService = pendingServiceRows[0];
  log('[createPendingServiceForWalkRequest] Inserted pending_service:', pendingService);

  let pricePreview = null;
  try {
    pricePreview = await previewPrice(
      server,
      'walk_window', // service_type must match rules table!
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
    log('[createPendingServiceForWalkRequest] Price preview result:', pricePreview);
  } catch (err) {
    log('[createPendingServiceForWalkRequest] ERROR in previewPrice:', err);
  }

  const response = pendingService
    ? { ...pendingService, price_preview: pricePreview }
    : null;

  log('[createPendingServiceForWalkRequest] FINAL RESPONSE:', response);

  return response;
}
