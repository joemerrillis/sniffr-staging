// src/boardings/controllers/boardingsController.js

import {
  listBoardings,
  getBoarding,
  createBoarding,
  updateBoarding,
  deleteBoarding
} from '../services/boardingsService.js';

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
    // Require blocks
    if (!drop_off_block || !pick_up_block) {
      return 'This tenant requires drop_off_block and pick_up_block.';
    }
    // Optionally: Validate block values (only if config provided)
    if (tenant.time_blocks_config && Array.isArray(tenant.time_blocks_config)) {
      const allowedBlocks = tenant.time_blocks_config;
      if (!allowedBlocks.includes(drop_off_block) || !allowedBlocks.includes(pick_up_block)) {
        return `Block values must be one of: ${allowedBlocks.join(', ')}`;
      }
    }
    // Times are allowed, but not required
  } else {
    // Require times
    if (!drop_off_time || !pick_up_time) {
      return 'This tenant requires drop_off_time and pick_up_time.';
    }
    // Blocks are ignored, so don’t error if present
  }
  return null;
}

/**
 * Create a new boarding with one or more dogs.
 * Request body should contain an array of dog_ids as `dogs`.
 */
export async function create(request, reply) {
  const userId = getUserId(request);
  const {
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
    dogs // <-- Array of dog_ids
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
    dogs // Array of dog_ids
  };

  try {
    // Service should create the boarding, then insert service_dogs for each dog
    const { boarding, service_dogs } = await createBoarding(request.server, payload);
    reply.code(201).send({ boarding, service_dogs });
  } catch (e) {
    reply.code(400).send({ error: e.message || e });
  }
}

/**
 * Update an existing boarding, including changing its set of dogs.
 * PATCH body may contain any updatable fields, including `dogs` (array of dog_ids).
 */
export async function modify(request, reply) {
  const { id } = request.params;
  // If tenant_id is provided (not required for PATCH), use for validation
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

  // Build payload as before
  const fields = [
    'drop_off_day', 'drop_off_block', 'drop_off_time', 'pick_up_day', 'pick_up_block', 'pick_up_time',
    'price', 'status', 'notes', 'proposed_drop_off_time', 'proposed_pick_up_time',
    'proposed_changes', 'booking_id', 'is_draft', 'approved_by', 'approved_at', 'final_price', 'dogs'
  ];
  const payload = {};
  for (const key of fields) {
    if (request.body[key] !== undefined) payload[key] = request.body[key];
  }

  try {
    // Service should update the boarding and sync service_dogs if dog array is present
    const { boarding, service_dogs } = await updateBoarding(request.server, id, payload);
    if (!boarding) return reply.code(404).send({ error: 'Boarding not found' });
    reply.send({ boarding, service_dogs });
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
