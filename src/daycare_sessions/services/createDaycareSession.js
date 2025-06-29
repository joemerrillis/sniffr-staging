// src/daycare_sessions/services/createDaycareSession.js

import needsApproval from '../helpers/needsApproval.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';
import { getDogIdsForRequest } from '../../helpers/dogSelector.js';

export default async function createDaycareSession(payload, server) {
  const { tenant_id, user_id, service_date, drop_off_time, expected_pick_up_time } = payload;
  let { dog_ids, ...rest } = payload;

  // 1. Determine dog_ids using the helper
  let resolvedDogIds = [];
  try {
    resolvedDogIds = await getDogIdsForRequest({
      user_id,
      supabase: server.supabase,
      explicitDogIds: dog_ids,
    });
  } catch (err) {
    throw new Error('No dogs found for user, or multiple dogs with none specified.');
  }

  // 2. Price preview
  const pricingResult = await previewPrice(server, 'daycare_session', {
    tenant_id,
    service_date,
    dog_ids: resolvedDogIds,
  });

  if (pricingResult.error) throw new Error(pricingResult.error);
  const price = pricingResult.price;
  const breakdown = pricingResult.breakdown || [];

  // 3. Approval logic
  const requiresApproval = await needsApproval(server, tenant_id, resolvedDogIds, service_date);

  // 4. Insert daycare session (no dog_ids column!)
  const { data, error } = await server.supabase
    .from('daycare_sessions')
    .insert({
      tenant_id,
      user_id,
      service_date,
      drop_off_time,
      expected_pick_up_time,
      price,
      status: requiresApproval ? 'pending_approval' : 'approved',
      ...rest
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // 5. Insert service_dogs rows (link all dogs to this session)
  let insertedServiceDogs = [];
  if (resolvedDogIds.length) {
    const dogRows = resolvedDogIds.map(dog_id => ({
      service_type: 'daycare',
      service_id: data.id,
      dog_id,
    }));
    const { data: inserted, error: serviceDogErr } = await server.supabase
      .from('service_dogs')
      .insert(dogRows)
      .select('*');
    if (serviceDogErr) throw new Error(serviceDogErr.message);
    insertedServiceDogs = inserted;
  }

  // 6. Insert into pending_services if not requiring approval
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
        dog_ids: resolvedDogIds,
        details: {
          service_date,
          drop_off_time,
          expected_pick_up_time
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

  return {
    daycare_session: { ...data, dogs: resolvedDogIds },
    pending_service,
    service_dogs: insertedServiceDogs,
    breakdown,
    requiresApproval
  };
}
