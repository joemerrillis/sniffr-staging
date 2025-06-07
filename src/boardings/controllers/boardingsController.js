// src/boardings/controllers/boardingsController.js

import {
  listBoardings,
  getBoarding,
  createBoarding,
  updateBoarding,
  deleteBoarding
} from '../services/boardingsService.js';

import { previewPrice } from '../../pricingRules/services/pricingEngine.js';

/**
 * Helper to extract the authenticated user's ID from the JWT.
 */
function getUserId(request) {
  return request.user.id ?? request.user.sub;
}

/**
 * Fetch the tenant config for validation.
 */
async function getTenantConfig(server, tenant_id) {
  const { data, error } = await server.supabase
    .from('tenants')
    .select('use_time_blocks, time_blocks_config')
    .eq('id', tenant_id)
    .single();
  if (error) throw new Error('Tenant not found');
  return data;
}

/**
 * List all boardings for a tenant, optionally filtering by client/user/booking.
 */
export async function list(request, reply) {
  const { tenant_id, user_id, booking_id } = request.query;
  const data = await listBoardings(request.server, { tenant_id, user_id, booking_id });
  reply.send({ boardings: data });
}

/**
 * Retrieve a single boarding by its ID, including its dogs.
 */
export async function retrieve(request, reply) {
  const { id } = request.params;
  const data = await getBoarding(request.server, id);
  if (!data) return reply.code(404).send({ error: 'Not found' });
  reply.send({ boarding: data });
}

/**
 * Validate time/block fields against tenant config.
 */
function validateBlockTimeFields(tenant, body) {
  const {
    drop_off_block, pick_up_block,
    drop_off_time, pick_up_time
  } = body;

  if (tenant.use_time_blocks) {
    if (!drop_off_block || !pick_up_block) {
      return 'This tenant requires drop_off_block and pick_up_block.';
    }
    if (tenant.time_blocks_config && Array.isArray(tenant.time_blocks_config)) {
      const allowedBlocks = tenant.time_blocks_config;
      if (!allowedBlocks.includes(drop_off_block) || !allowedBlocks.includes(pick_up_block)) {
        return `Block values must be one of: ${allowedBlocks.join(', ')}`;
      }
    }
  } else {
    if (!drop_off_time || !pick_up_time) {
      return 'This tenant requires drop_off_time and pick_up_time.';
    }
  }
  return null;
}

/**
 * Create a new boarding with one or more dogs.
 * Request body should contain an array of dog_ids as `dogs`.
 * If not provided, all user's dogs (from dog_owners) are used.
 */
export async function create(request, reply) {
  const userId = getUserId(request);
  let {
    tenant_id,
    drop_off_day,
    drop_off_block,
    drop_off_time,
    pick_up_day,
    pick_up_block,
    pick_up_time,
    price, // May be omitted by client, we’ll calculate if missing
    notes,
    proposed_drop_off_time,
    proposed_pick_up_time,
    proposed_changes,
    booking_id,
    is_draft,
    final_price,
    dogs // <-- Array of dog_ids, may be undefined
  } = request.body;

  // Tenant-aware validation
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

  // If no dogs provided, fetch all the user's dogs from dog_owners table
  if (!Array.isArray(dogs) || !dogs.length) {
    const { data: ownedDogs, error: dogErr } = await request.server.supabase
      .from('dog_owners')
      .select('dog_id')
      .eq('user_id', userId);
    if (dogErr) return reply.code(400).send({ error: 'Could not fetch user dogs.' });
    dogs = ownedDogs ? ownedDogs.map(d => d.dog_id) : [];
  }

  // ==== New logic: Pricing engine integration ====
  let pricingResult = null;
  let reasons = [];
  let breakdown = [];
  if (!price || isNaN(Number(price))) {
    // Try to compute price using pricingRules engine
    try {
      pricingResult = await previewPrice(request.server, 'boarding', {
        tenant_id,
        drop_off_day,
        pick_up_day,
        dog_ids: dogs
      });
      if (pricingResult.error) {
        return reply.code(400).send({ error: pricingResult.error, reasons: pricingResult.breakdown || [] });
      }
      price = pricingResult.price;
      breakdown = pricingResult.breakdown || [];
      reasons = breakdown;
    } catch (err) {
      return reply.code(400).send({ error: 'Failed to compute price', details: err.message });
    }
  }

  // Build the payload
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
    dogs
  };

  try {
    const { boarding, service_dogs } = await createBoarding(request.server, payload);
    reply.code(201).send({ boarding, service_dogs, reasons });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

/**
 * Update an existing boarding, including changing its set of dogs.
 * PATCH body may contain any updatable fields, including `dogs` (array of dog_ids).
 * If not provided, all user's dogs (from dog_owners) are used.
 */
export async function modify(request, reply) {
  const { id } = request.params;
  const userId = getUserId(request);
  const { tenant_id } = request.body;

  // Tenant-aware validation (only if tenant_id present in PATCH)
  if (tenant_id) {
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
  }

  // Prepare dogs array: If omitted, fetch from dog_owners
  let { dogs } = request.body;
  if (!Array.isArray(dogs) || !dogs.length) {
    const { data: ownedDogs, error: dogErr } = await request.server.supabase
      .from('dog_owners')
      .select('dog_id')
      .eq('user_id', userId);
    if (dogErr) return reply.code(400).send({ error: 'Could not fetch user dogs.' });
    dogs = ownedDogs ? ownedDogs.map(d => d.dog_id) : [];
  }

  // Build payload as before, but recalculate price
  const fields = [
    'drop_off_day', 'drop_off_block', 'drop_off_time', 'pick_up_day', 'pick_up_block', 'pick_up_time',
    'status', 'notes', 'proposed_drop_off_time', 'proposed_pick_up_time',
    'proposed_changes', 'booking_id', 'is_draft', 'approved_by', 'approved_at', 'final_price'
  ];
  const payload = {};
  for (const key of fields) {
    if (request.body[key] !== undefined) payload[key] = request.body[key];
  }
  payload.dogs = dogs;

  let reasons = [];
  try {
    // Use either incoming or existing values as context
    const currentBoarding = await getBoarding(request.server, id);
    const newDropOff = payload.drop_off_day || currentBoarding.drop_off_day;
    const newPickUp = payload.pick_up_day || currentBoarding.pick_up_day;
    const newDogs = payload.dogs || currentBoarding.dogs;

    const priceResult = await previewPrice(
      request.server,
      'boarding',
      {
        tenant_id: tenant_id || currentBoarding.tenant_id,
        drop_off_day: newDropOff,
        pick_up_day: newPickUp,
        dog_ids: newDogs
      }
    );
    if (priceResult.error) {
      request.log.error({ priceResult }, '[Boardings] Pricing engine error (modify)');
      return reply.code(400).send({ error: priceResult.error, missing_fields: priceResult.missing_fields });
    }
    payload.price = priceResult.price;
    reasons = priceResult.breakdown || [];
  } catch (err) {
    request.log.error({ err }, '[Boardings] Exception during price calculation (modify)');
    return reply.code(500).send({ error: 'Error calculating price.' });
  }

  try {
    const { boarding, service_dogs } = await updateBoarding(request.server, id, payload);
    if (!boarding) return reply.code(404).send({ error: 'Boarding not found' });
    reply.send({ boarding, service_dogs, reasons });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

/**
 * Delete a boarding.
 */
export async function remove(request, reply) {
  const { id } = request.params;
  await deleteBoarding(request.server, id);
  reply.code(204).send();
}
