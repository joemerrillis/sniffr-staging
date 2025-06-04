// src/purchases/services/promoteCartService.js

function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  return `${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}Z`;
}

function averageTimeISO(dateStr, startStr, endStr) {
  const startISO = combineDateAndTime(dateStr, startStr);
  const endISO = combineDateAndTime(dateStr, endStr);
  if (!startISO || !endISO) return null;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start) || isNaN(end)) return null;
  return new Date((start.getTime() + end.getTime()) / 2).toISOString();
}

async function findDefaultWalkerId(server, tenant_id, dogIds) {
  // 1. Get all assignments for all dogs on this walk
  let walkerPriorityTotals = {}; // {walker_id: total_priority}
  const today = new Date();

  // Keep track of which walkers are assigned to which dogs
  let assignmentMatrix = {}; // {walker_id: Set of dog_ids}
  for (const dogId of dogIds) {
    const { data: assignments } = await server.supabase
      .from('dog_assignments')
      .select('walker_id, priority, start_date, end_date')
      .eq('dog_id', dogId)
      .eq('source', 'tenant')
      .order('priority', { ascending: false });

    if (assignments && assignments.length) {
      const activeAssignments = assignments.filter(a =>
        (!a.start_date || new Date(a.start_date) <= today) &&
        (!a.end_date   || new Date(a.end_date)   >= today)
      );
      for (const a of activeAssignments) {
        walkerPriorityTotals[a.walker_id] = (walkerPriorityTotals[a.walker_id] || 0) + (a.priority || 0);
        if (!assignmentMatrix[a.walker_id]) assignmentMatrix[a.walker_id] = new Set();
        assignmentMatrix[a.walker_id].add(dogId);
      }
    }
  }

  if (Object.keys(walkerPriorityTotals).length === 0) {
    return null; // No default found, fallback needed
  }

  // 2. Find highest total priority
  let maxPriority = Math.max(...Object.values(walkerPriorityTotals));
  let candidates = Object.entries(walkerPriorityTotals)
    .filter(([_, total]) => total === maxPriority)
    .map(([walker_id]) => walker_id);

  // 3. If tie, break by most recent walker for these dogs
  if (candidates.length > 1) {
    let mostRecentWalker = null;
    let mostRecentDate = null;
    // Find most recent walk for these dogs by any candidate walker
    for (const walker_id of candidates) {
      // Only look for walks performed by candidate walker for *any* of these dogs, for this tenant
      const { data: recentWalk } = await server.supabase
        .from('walks')
        .select('scheduled_at')
        .contains('dog_ids', dogIds) // assumes dog_ids is an array column
        .eq('tenant_id', tenant_id)
        .eq('walker_id', walker_id)
        .order('scheduled_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentWalk && (!mostRecentDate || new Date(recentWalk.scheduled_at) > new Date(mostRecentDate))) {
        mostRecentDate = recentWalk.scheduled_at;
        mostRecentWalker = walker_id;
      }
    }
    if (mostRecentWalker) {
      return mostRecentWalker;
    }
    // If still tied (no walk history), just use the first
    return candidates[0];
  } else {
    return candidates[0]; // Only one candidate
  }
}

export async function promoteCart(server, purchase) {
  const { cart, tenant_id, user_id } = purchase;

  for (const pendingServiceId of cart) {
    const { data: pending, error } = await server.supabase
      .from('pending_services')
      .select('*')
      .eq('id', pendingServiceId)
      .single();
    if (error || !pending) continue;

    // --- Handle Walks ---
    if (pending.service_type === 'walk_window' || pending.service_type === 'walk') {
      let scheduled_at = pending.service_date;
      if (pending.details?.window_start && pending.details?.window_end) {
        scheduled_at = averageTimeISO(
          pending.service_date,
          pending.details.window_start,
          pending.details.window_end
        );
      } else if (pending.details?.window_start) {
        scheduled_at = combineDateAndTime(pending.service_date, pending.details.window_start);
      }

      if (!scheduled_at || isNaN(new Date(scheduled_at))) {
        console.error('Invalid scheduled_at value:', scheduled_at, pending);
        throw new Error('Invalid walk window times or date');
      }

      // Array of dogs for this walk window
      const dogIds = pending.dog_ids || (pending.dog_id ? [pending.dog_id] : []);
      if (!dogIds.length) {
        console.error('No dog_ids found in pending_service:', pending);
        continue;
      }

      // --- New walker assignment logic! ---
      let walker_id = await findDefaultWalkerId(server, tenant_id, dogIds);

      // If not found, fallback to existing logic: autofill if only one, or fallback to tenantClient primary_walker_id
      if (!walker_id) {
        const { data: employees, error: empError } = await server.supabase
          .from('employees')
          .select('user_id')
          .eq('tenant_id', tenant_id);
        if (!empError && employees && employees.length === 1) {
          walker_id = employees[0].user_id;
        } else {
          const { data: tenantClient } = await server.supabase
            .from('tenant_clients')
            .select('primary_walker_id')
            .eq('tenant_id', tenant_id)
            .eq('user_id', pending.user_id)
            .maybeSingle();
          if (tenantClient?.primary_walker_id) {
            walker_id = tenantClient.primary_walker_id;
          }
        }
      }

      const walkPayload = {
        tenant_id,
        dog_ids: dogIds,
        user_id: pending.user_id,
        walker_id,
        scheduled_at,
        duration_minutes: pending.details?.length_minutes || 30,
        status: 'unscheduled', // always at creation now
        created_at: new Date().toISOString()
      };
      console.log('Walk insert payload:', walkPayload);

      const { error: walkInsertError, data: walkInsertData } = await server.supabase.from('walks').insert([walkPayload]);
      if (walkInsertError) {
        console.error('Failed to insert walk:', walkInsertError);
      } else {
        console.log('Walk insert result:', walkInsertData);
      }

      // --- Clean up logic ---
      if (pending.request_id) {
        // This was a one-time walk request, so delete the original request (cart row should be removed by cascade, but can be safe to check)
        await server.supabase.from('client_walk_requests').delete().eq('id', pending.request_id);
      } else if (pending.walk_window_id) {
        // This was from a standing window, so ONLY delete the pending_services row
        await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
      }
    }

    // --- Handle Boardings ---
    else if (pending.service_type === 'boarding') {
      await server.supabase.from('boardings').insert([{
        tenant_id,
        dog_id: pending.dog_id,
        user_id: pending.user_id,
        drop_off_day: pending.details?.start_date || pending.service_date,
        pick_up_day: pending.details?.end_date || pending.service_date,
        price: pending.details?.price || 0,
        status: 'draft',
        created_at: new Date().toISOString()
      }]);
      if (pending.boarding_request_id) {
        await server.supabase.from('boardings').delete().eq('id', pending.boarding_request_id);
      }
    }

    // --- Handle Daycare ---
    else if (pending.service_type === 'daycare') {
      await server.supabase.from('daycare_sessions').insert([{
        tenant_id,
        dog_id: pending.dog_id,
        user_id: pending.user_id,
        dropoff_time: pending.service_date,
        expected_pickup_time: pending.details?.expected_pickup_time,
        penalty_amount: 0,
        status: 'draft',
        created_at: new Date().toISOString()
      }]);
      if (pending.daycare_request_id) {
        await server.supabase.from('daycare_sessions').delete().eq('id', pending.daycare_request_id);
      }
    }
    // Add more service types here as needed!
  }
}
