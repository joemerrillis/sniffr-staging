import {
  getWalkSchedulesForWeek,
  batchConfirmWalksForDay,
  updateWalkSchedule,
  approveWalkChange,
  // ... boarding/daycare logic
} from '../services/schedulingService.js';

/**
 * GET /scheduling/walks
 * List all walks for a tenant in a given week (draft/scheduled/approved)
 */
export async function listWalks(request, reply) {
  const { tenant_id, week_start } = request.query;
  const walks = await getWalkSchedulesForWeek(request.server, tenant_id, week_start);
  reply.send({ walks });
}

/**
 * PATCH /scheduling/walks/confirm-day
 * Confirm all draft walks for a day (moves from draft to scheduled)
 */
export async function confirmWalksForDay(request, reply) {
  const { tenant_id, date } = request.body;
  const updated = await batchConfirmWalksForDay(request.server, tenant_id, date);
  reply.send({ walks: updated });
}

/**
 * PATCH /scheduling/walks/:walk_id
 * Update a single walk (time, walker, etc), may require client approval
 */
export async function updateWalk(request, reply) {
  const { walk_id } = request.params;
  const payload = request.body;
  const updated = await updateWalkSchedule(request.server, walk_id, payload);
  reply.send({ walk: updated });
}

/**
 * PATCH /scheduling/walks/:walk_id/approve
 * Client approves a time/walker change outside window
 */
export async function approveWalk(request, reply) {
  const { walk_id } = request.params;
  const updated = await approveWalkChange(request.server, walk_id);
  reply.send({ walk: updated });
}
