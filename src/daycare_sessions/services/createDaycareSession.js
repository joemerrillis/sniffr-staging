// src/daycare_sessions/services/createDaycareSession.js

import needsApproval from '../helpers/needsApproval.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

export default async function createDaycareSession(payload, server) {
  const { tenant_id, user_id, service_date } = payload;
  let { dog_ids, ...rest } = payload;

  // 1. Determine dogs to include (use provided or fetch from dog_owners)
  if (!dog_ids || !dog_ids.length) {
    const { data: ownedDogs, error: dogErr } = await server.supabase
      .from('dog_owners')
      .select('dog_id')
      .eq('user_id', user_id);
    if (dogErr) throw new Error('Could not fetch user dogs.');
    dog_ids = ownedDogs ? ownedDogs.map(d => d.dog_id) : [];
    if (!dog_ids.length) throw new Error('No dogs found for user.');
  }

  // 2. Price preview (pass the right context!)
  const pricingResult = await previewPrice(server, 'daycare_session', {
    tenant_id,
    service_date,
    dog_ids,
  });

  if (pricingResult.error) throw new Error(pricingResult.error);

  const price = pricingResult.price;
  const breakdown = pricingResult.breakdown || [];

  // 3. Approval logic
  const requiresApproval = await needsApproval(server, tenant_id, dog_ids, service_date);

  // 4. Insert daycare session (no dog_ids column!)
  const { data, error } = await server.supabase
    .from('daycare_sessions')
    .insert({
      tenant_id,
      user_id,
      service_date,
      price,
      status: requiresApproval ? 'pending_approval' : 'approved',
      ...rest
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // 5. Insert service_dogs rows
  let insertedServiceDogs = [];
  if (dog_ids.length) {
    const dogRows = dog_ids.map(dog_id => ({
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
        dog_ids,
        details: { service_date },
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
    daycare_session: { ...data, dogs: dog_ids },
    pending_service,
    service_dogs: insertedServiceDogs,
    breakdown,
    requiresApproval
  };
}
