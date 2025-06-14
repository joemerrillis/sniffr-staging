// src/daycare_sessions/services/createDaycareSession.js

import needsApproval from '../helpers/needsApproval.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

// Helper to compute hours as decimal between two "HH:mm" strings
function computeHours(start, end) {
  if (!start || !end) return undefined;
  // Use built-in JS Date for pure time math (date part is irrelevant)
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  let diff = endMins - startMins;
  // If pickup is after midnight (shouldn't happen for daycare, but just in case)
  if (diff < 0) diff += 24 * 60;
  return +(diff / 60).toFixed(2); // force decimal, max two decimals
}

export default async function createDaycareSession(server, payload) {
  // Normalize and destructure
  const {
    tenant_id,
    user_id,
    dog_id,         // Could be dog_id or dog_ids array (for multi-dog in future)
    dog_ids,
    service_date,
    drop_off_time,
    expected_pick_up_time,
    notes,
    // ...rest
    ...rest
  } = payload;

  // Always have dog_ids as an array
  const _dog_ids = Array.isArray(dog_ids)
    ? dog_ids
    : dog_id
      ? [dog_id]
      : [];

  // Compute hours for pricing
  const hours = computeHours(drop_off_time, expected_pick_up_time);

  // Build context for pricing engine (MUST match rule_type: "daycare_session")
  const pricingContext = {
    tenant_id,
    service_date,
    hours,
    dog_ids: _dog_ids,
    // Any other context fields you want pricing rules to match on
  };

  // Price preview using the right rule_type
  const pricingResult = await previewPrice(server, 'daycare_session', pricingContext);

  if (pricingResult.error) throw new Error(pricingResult.error);
  const price = pricingResult.price;
  const breakdown = pricingResult.breakdown || [];

  // Approval check: (You may want to pass service_date + hours for the whole window)
  const requiresApproval = await needsApproval(
    server,
    tenant_id,
    _dog_ids,
    service_date,
    service_date // For daycare, dropoff/pickup is same date; pass both as same day
  );

  // Insert daycare session
  const { data, error } = await server.supabase
    .from('daycare_sessions')
    .insert({
      tenant_id,
      user_id,
      service_date,
      drop_off_time,
      expected_pick_up_time,
      notes,
      dog_ids: _dog_ids,
      price,
      status: requiresApproval ? 'pending_approval' : 'approved',
      ...rest
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // Insert pending_services if auto-approved
  let pending_service = null;
  if (!requiresApproval) {
    const { data: ps, error: psErr } = await server.supabase
      .from('pending_services')
      .insert({
        user_id,
        tenant_id,
        service_date,
        service_type: 'daycare',
        daycare_request_id: data.id,
        dog_ids: _dog_ids,
        details: {
          drop_off_time,
          expected_pick_up_time,
          hours
        },
        is_confirmed: false,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    if (psErr) {
      console.error('[DaycareCreate] Error inserting pending_service:', psErr);
    }
    pending_service = ps;
  }

  return { daycare_session: data, pending_service, breakdown, requiresApproval };
}
