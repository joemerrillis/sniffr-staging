// src/availability/controllers/availabilityController.js

import { fetchBusyIntervals, buildHeatmap, fetchBlackouts } from '../services/availabilityService.js';

export async function getGlobalHeatmap(request, reply) {
  const tenant_id = request.user.tenant_id;
  const { date, walk_length = 30 } = request.query;

  if (!date) return reply.code(400).send({ error: 'Missing date' });

  // 1. Get all busy intervals (all walkers)
  const busyIntervals = await fetchBusyIntervals(request.server, date, tenant_id);

  // 2. Build the heatmap for the requested walk length and default padding
  const slots = buildHeatmap(busyIntervals, Number(walk_length));

  // 3. Optionally: compute "suggested" open times
  const suggested = suggestOpenSlots(slots, Number(walk_length));

  reply.send({
    date,
    slots,
    suggested
  });
}

export async function getDogHeatmap(request, reply) {
  const tenant_id = request.user.tenant_id;
  const { dog_id } = request.params;
  const { date, walk_length = 30 } = request.query;
  if (!date) return reply.code(400).send({ error: 'Missing date' });

  // Find assigned walkers for this dog (primary/backup)
  const { data: assignments, error } = await request.server.supabase
    .from('dog_assignments')
    .select('walker_id')
    .eq('dog_id', dog_id);
  if (error) throw error;
  const walkerIds = assignments.map(a => a.walker_id);

  // Get busy intervals just for those walkers
  const { data: walks, error: walkError } = await request.server.supabase
    .from('walks')
    .select('walker_id, scheduled_at, duration_minutes')
    .eq('tenant_id', tenant_id)
    .eq('status', 'scheduled')
    .in('walker_id', walkerIds)
    .gte('scheduled_at', date + 'T00:00:00')
    .lt('scheduled_at', date + 'T23:59:59');

  if (walkError) throw walkError;
  const busyIntervals = walks.map(walk => ({
    walker_id: walk.walker_id,
    start: new Date(walk.scheduled_at),
    end: new Date(new Date(walk.scheduled_at).getTime() + walk.duration_minutes * 60000)
  }));

  const slots = buildHeatmap(busyIntervals, Number(walk_length));
  const suggested = suggestOpenSlots(slots, Number(walk_length));

  reply.send({
    date,
    slots,
    suggested
  });
}

export async function getBlackouts(request, reply) {
  const tenant_id = request.user.tenant_id;
  const blackouts = await fetchBlackouts(request.server, tenant_id);
  reply.send({ blackouts });
}

/**
 * Suggests open intervals from heatmap slots for walk_length.
 */
function suggestOpenSlots(slots, walkLength) {
  // Finds continuous available slots that can fit walkLength
  const step = 5;
  const neededSlots = Math.ceil(walkLength / step);
  let open = [];
  let startIdx = null;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].available) {
      if (startIdx === null) startIdx = i;
      // If we have enough consecutive open slots:
      if (i - startIdx + 1 >= neededSlots) {
        open.push({
          start: slots[startIdx].time,
          end: slots[i].time
        });
        // Move to next window
        startIdx = null;
      }
    } else {
      startIdx = null;
    }
  }
  return open;
}
