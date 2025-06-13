import getUserId from './getUserId.js';
import getTenantConfig from './getTenantConfig.js';
import validateBlockTimeFields from './validateBlockTimeFields.js';
import { createBoarding } from '../services/index.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

// Helper: Checks if any dog has a negative sentiment with any other dog in the cohort during the booking dates
async function needsApproval(server, tenant_id, dog_ids, drop_off_day, pick_up_day) {
  // For simplicity, check for *any* negative sentiment involving any of the dogs during the period
  const { data, error } = await server.supabase
    .from('dog_cohorts')
    .select('dog_id, co_dog_id, start_date, end_date, sentiment')
    .in('dog_id', dog_ids)
    .gte('end_date', drop_off_day)
    .lte('start_date', pick_up_day)
    .eq('sentiment', 'negative');

  if (error) {
    console.error('[BoardingCreate] Error checking dog_cohorts for negative sentiment:', error);
    // Be safe: require approval if we can't check
    return true;
  }

  return data && data.length > 0;
}

async function createPendingServiceForBoarding(server, boarding) {
  // Insert a pending_services row for this boarding
  const { data, error } = await server.supabase
    .from('pending_services')
    .insert([{
      user_id: boarding.user_id,
      tenant_id: boarding.tenant_id,
      service_date: boarding.drop_off_day,
      service_type: 'boarding',
      boarding_request_id: boarding.id,
      dog_ids: boarding.dogs,
      details: { drop_off_day: boarding.drop_off_day, pick_up_day: boarding.pick_up_day },
      is_confirmed: false,
      created_at: new Date().toISOString()
    }]);
  if (error) {
    console.error('[BoardingCreate] Failed to insert into pending_services:', error);
  }
}

export default async function create(request, reply) {
  const userId = getUserId(request);
  let {
    tenant_id,
    drop_off_day,
    drop_off_block,
    drop_off_time,
    pick_up_day,
    pick_up_block,
    pick_up_time,
    price,
    notes,
    proposed_drop_off_time,
    proposed_pick_up_time,
    proposed_changes,
    booking_id,
    is_draft,
    final_price,
    dogs
  } = request.body;

  let tenant;
  try {
    tenant = await getTenantConfig(request.server, tenant_id);
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
  const blockTimeErr = validateBlockTimeFields(tenant, request.body);
  if (blockTimeErr) {
    return reply.code(400).send({ error: blockTimeErr });
  }

  if (!Array.isArray(dogs) || !dogs.length) {
    const { data: ownedDogs, error: dogErr } = await request.server.supabase
      .from('dog_owners')
      .select('dog_id')
      .eq('user_id', userId);
    if (dogErr) return reply.code(400).send({ error: 'Could not fetch user dogs.' });
    dogs = ownedDogs ? ownedDogs.map(d => d.dog_id) : [];
  }

  let pricingResult = null;
  let breakdown = [];
  if (!price || isNaN(Number(price))) {
    try {
      pricingResult = await previewPrice(request.server, 'boarding', {
        tenant_id,
        drop_off_day,
        pick_up_day,
        dog_ids: dogs
      });
      if (pricingResult.error) {
        return reply.code(400).send({ error: pricingResult.error, breakdown: pricingResult.breakdown || [] });
      }
      price = pricingResult.price;
      breakdown = pricingResult.breakdown || [];
    } catch (err) {
      return reply.code(400).send({ error: 'Failed to compute price', details: err.message });
    }
  }

  // 1. Check if this boarding requires approval (any negative sentiment in cohort)
  let requiresApproval = await needsApproval(
    request.server,
    tenant_id,
    dogs,
    drop_off_day,
    pick_up_day
  );

  // 2. Create the boarding row (may be draft or pending_approval)
  const payload = {
    tenant_id,
    user_id: userId,
    drop_off_day,
    drop_off_block,
    drop_off_time,
    pick_up_day,
    pick_up_block,
    pick_up_time,
    price,
    notes,
    proposed_drop_off_time,
    proposed_pick_up_time,
    proposed_changes,
    booking_id,
    is_draft,
    final_price,
    dogs,
    status: requiresApproval ? 'pending_approval' : 'draft'
  };

  try {
    const { boarding, service_dogs } = await createBoarding(request.server, payload);

    // 3. If auto-approved, add to pending_services
    if (!requiresApproval) {
      await createPendingServiceForBoarding(request.server, boarding);
    }
    reply.code(201).send({ boarding, service_dogs, breakdown, requiresApproval });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
