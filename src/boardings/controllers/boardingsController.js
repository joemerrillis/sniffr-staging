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

  // You might want to add validation here for required fields, etc.

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
  const {
    drop_off_day,
    drop_off_block,
    drop_off_time,
    pick_up_day,
    pick_up_block,
    pick_up_time,
    price,
    status,
    notes,
    proposed_drop_off_time,
    proposed_pick_up_time,
    proposed_changes,
    booking_id,
    is_draft,
    approved_by,
    approved_at,
    final_price,
    dogs // <-- Array of dog_ids
  } = request.body;

  const payload = {
    ...(drop_off_day !== undefined && { drop_off_day }),
    ...(drop_off_block !== undefined && { drop_off_block }),
    ...(drop_off_time !== undefined && { drop_off_time }),
    ...(pick_up_day !== undefined && { pick_up_day }),
    ...(pick_up_block !== undefined && { pick_up_block }),
    ...(pick_up_time !== undefined && { pick_up_time }),
    ...(price !== undefined && { price }),
    ...(status !== undefined && { status }),
    ...(notes !== undefined && { notes }),
    ...(proposed_drop_off_time !== undefined && { proposed_drop_off_time }),
    ...(proposed_pick_up_time !== undefined && { proposed_pick_up_time }),
    ...(proposed_changes !== undefined && { proposed_changes }),
    ...(booking_id !== undefined && { booking_id }),
    ...(is_draft !== undefined && { is_draft }),
    ...(approved_by !== undefined && { approved_by }),
    ...(approved_at !== undefined && { approved_at }),
    ...(final_price !== undefined && { final_price }),
    ...(dogs !== undefined && { dogs })
  };

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
