import getUserId from './getUserId.js';
import getTenantConfig from './getTenantConfig.js';
import validateBlockTimeFields from './validateBlockTimeFields.js';
import { createBoarding } from '../services/index.js';
import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

// Helper: Checks if any dog has a negative sentiment with any other dog in the cohort during the booking dates
async function needsApproval(server, tenant_id, dog_ids, drop_off_day, pick_up_day) {
  // Checks for any negative overlap for these dogs during the requested boarding period
  const { data, error } = await server.supabase
    .from('dog_cohort_overlap')
    .select('dog_id, co_dog_id, overlap_start, overlap_end, sentiment')
    .in('dog_id', dog_ids)
    .gte('overlap_end', drop_off_day)
    .lte('overlap_start', pick_up_day)
    .eq('sentiment', 'negative');

  console.log('[needsApproval] data:', data, '| error:', error, '| dog_ids:', dog_ids, '| drop_off_day:', drop_off_day, '| pick_up_day:', pick_up_day);

  if (error) {
    console.error('[BoardingCreate] Error checking dog_cohort_overlap for negative sentiment:', error);
    // Safe default: require approval if error
    return true;
  }

  return data && data.length > 0;
}

async function createPendingServiceForBoarding(server, boarding) {
  // Always use UUIDs for dog_ids
  const dog_ids = Array.isArray(boarding.dogs)
    ? boarding.dogs.map(d => typeof d === 'string' ? d : d.dog_id)
    : [];

  // Prevent duplicate inserts (idempotency)
  const { data: existing, error: selectError } = await server.supabase
    .from('pending_services')
    .select('id')
    .eq('boarding_request_id', boarding.id)
    .maybeSingle();

  if (existing) {
    console.log('[BoardingCreate] Pending service already exists for this boarding.');
    return existing;
  }

  // Insert pending_services row for this boarding
  const { data, error } = await server.supabase
    .from('pending_services')
    .insert([{
      user_id: boarding.user_id,
      tenant_id: boarding.tenant_id,
      service_date: boarding.drop_off_day,
      service_type: 'boarding',
      boarding_request_id: boarding.id,
      dog_ids,
      details: { drop_off_day: boarding.drop_off_day, pick_up_day: boarding.pick_up_day },
      is_confirmed: false,
      created_at: new Date().toISOString()
    }])
    .select('*')
    .single();

  if (error) {
    console.error('[BoardingCreate] Failed to insert into pending_services:', error);
    return null;
  }
  return data;
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

  // Normalize dogs to always be UUIDs
  if (!Array.isArray(dogs) || !dogs.length) {
    const { data: ownedDogs, error: dogErr } = await request.server.supabase
      .from('dog_owners')
      .select('dog_id')
      .eq('user_id', userId);
    if (dogErr) return reply.code(400).send({ error: 'Could not fetch user dogs.' });
    dogs = ownedDogs ? ownedDogs.map(d => d.dog_id) : [];
  } else {
    dogs = dogs.map(d => typeof d === 'string' ? d : d.dog_id);
  }

  // Validate block/time fields
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

  // Get price if not provided
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

  // 1. Check if this boarding requires approval
  let requiresApproval = await needsApproval(
    request.server,
    tenant_id,
    dogs,
    drop_off_day,
    pick_up_day
  );

  // 2. Set the correct initial status
  const status = requiresApproval ? 'pending_approval' : 'confirmed';

  // 3. Create the boarding row
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
    is_draft: false, // Draft should be false if submitting for real
    final_price,
    dogs,
    status
  };

  try {
    const { boarding, service_dogs } = await createBoarding(request.server, payload);

    // 4. If auto-approved, add to pending_services immediately
    let pending_service = null;
    if (!requiresApproval) {
      pending_service = await createPendingServiceForBoarding(request.server, boarding);
    }

    reply.code(201).send({
      boarding: { ...boarding, status },
      service_dogs,
      breakdown,
      requiresApproval,
      pending_service // include for symmetry with walks
    });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}
