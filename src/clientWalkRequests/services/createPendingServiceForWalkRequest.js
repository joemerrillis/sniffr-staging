// src/clientWalkRequests/services/createPendingServiceForWalkRequest.js
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';
import { log } from './logger.js';

export default async function createPendingServiceForWalkRequest(server, {
  user_id, tenant_id, walk_date, dog_ids, window_start, window_end, walk_length_minutes, request_id
}) {
  const pendingInsert = {
    user_id,
    tenant_id,
    service_date: walk_date,
    service_type: 'walk_window',
    request_id,
    dog_ids,
    details: { window_start, window_end, walk_length_minutes },
    is_confirmed: false,
    created_at: new Date().toISOString(),
  };

  const { data: pendingServiceRows, error: pendingError } = await server.supabase
    .from('pending_services')
    .insert([pendingInsert])
    .select('*');
  if (pendingError) throw pendingError;
  const pendingService = pendingServiceRows[0];

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
    log('Price preview for pending_service:', pricePreview);
  }

  return pendingService
    ? { ...pendingService, price_preview: pricePreview }
    : null;
}
