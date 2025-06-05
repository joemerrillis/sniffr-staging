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

async function findDefaultEmployeeId(server, tenant_id, dogIds, user_id, scheduled_at) {
  const { data: employees, error: empError } = await server.supabase
    .from('employees')
    .select('id, user_id')
    .eq('tenant_id', tenant_id);
  if (empError || !employees || !employees.length) return null;

  const today = scheduled_at ? scheduled_at.slice(0, 10) : (new Date()).toISOString().slice(0, 10);
  const { data: assignments, error: assignErr } = await server.supabase
    .from('dog_assignments')
    .select('dog_id, walker_id, priority, start_date, end_date')
    .in('dog_id', dogIds);
  if (assignErr) return null;

  const validAssignments = assignments.filter(a =>
    (!a.start_date || a.start_date <= today) &&
    (!a.end_date || a.end_date >= today)
  );

  const priorityMap = {};
  for (const dogId of dogIds) {
    for (const a of validAssignments.filter(row => row.dog_id === dogId)) {
      if (!priorityMap[a.walker_id]) priorityMap[a.walker_id] = 0;
      priorityMap[a.walker_id] += Number(a.priority || 0);
    }
  }

  let maxPriority = -1;
  let walkerCandidates = [];
  for (const walkerId in priorityMap) {
    const total = priorityMap[walkerId];
    if (total > maxPriority) {
      maxPriority = total;
      walkerCandidates = [walkerId];
    } else if (total === maxPriority) {
      walkerCandidates.push(walkerId);
    }
  }

  let bestEmployeeId = null;
  if (walkerCandidates.length === 1) {
    bestEmployeeId = walkerCandidates[0];
  } else if (walkerCandidates.length > 1) {
    const { data: lastWalks } = await server.supabase
      .from('walks')
      .select('walker_id, scheduled_at, dog_ids')
      .contains('dog_ids', dogIds)
      .in('walker_id', walkerCandidates)
      .order('scheduled_at', { ascending: false })
      .limit(10);

    if (lastWalks && lastWalks.length > 0) {
      for (const empId of walkerCandidates) {
        if (lastWalks.some(walk => walk.walker_id === empId)) {
          bestEmployeeId = empId;
          break;
        }
      }
    }
    if (!bestEmployeeId) bestEmployeeId = walkerCandidates[0];
  }

  if (!bestEmployeeId) {
    if (employees.length === 1) {
      return employees[0].id;
    }
    const { data: tenantClient } = await server.supabase
      .from('tenant_clients')
      .select('primary_walker_id')
      .eq('tenant_id', tenant_id)
      .eq('user_id', user_id)
      .maybeSingle();
    if (tenantClient?.primary_walker_id) {
      const emp = employees.find(e => e.user_id === tenantClient.primary_walker_id);
      if (emp) return emp.id;
    }
    return null;
  }

  return bestEmployeeId;
}

export async function promoteCart(server, purchase) {
  const { cart, tenant_id, user_id, amount } = purchase;

  // You might want to get the boardings total due (for comparison).
  // For this example, assume you have a "deposit" threshold.
  // Adjust logic to your app's payment requirements.
  const DEPOSIT_AMOUNT = 100; // adjust as needed

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

      const dogIds = pending.dog_ids || (pending.dog_id ? [pending.dog_id] : []);
      if (!dogIds.length) {
        console.error('No dog_ids found in pending_service:', pending);
        continue;
      }

      const walker_id = await findDefaultEmployeeId(server, tenant_id, dogIds, pending.user_id, scheduled_at);

      const walkPayload = {
        tenant_id,
        dog_ids: dogIds,
        user_id: pending.user_id,
        walker_id,
        scheduled_at,
        duration_minutes: pending.details?.length_minutes || 30,
        status: 'unscheduled',
        created_at: new Date().toISOString()
      };
      console.log('Walk insert payload:', walkPayload);

      const { error: walkInsertError, data: walkInsertData } = await server.supabase.from('walks').insert([walkPayload]);
      if (walkInsertError) {
        console.error('Failed to insert walk:', walkInsertError, walkPayload);
      } else {
        console.log('Walk insert result:', walkInsertData);
      }

      if (pending.request_id) {
        await server.supabase.from('client_walk_requests').delete().eq('id', pending.request_id);
      } else if (pending.walk_window_id) {
        await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
      }
    }

    // --- Handle Boardings ---
    else if (pending.service_type === 'boarding') {
      // Update existing boarding status instead of inserting/deleting
      let newStatus = 'purchased'; // Default to purchased

      // (OPTIONAL: fetch boarding price if you want to compare with amount paid)
      // Example: if (amount < boarding.price) newStatus = 'booked';

      // Use boarding_request_id to update the correct boarding row
      if (pending.boarding_request_id) {
        await server.supabase.from('boardings')
          .update({ status: newStatus })
          .eq('id', pending.boarding_request_id);
      }
      // Clean up the pending_services row
      await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
    }

    // --- Handle Daycare ---
    else if (pending.service_type === 'daycare') {
      // Update existing daycare_session status instead of inserting/deleting
      if (pending.daycare_request_id) {
        await server.supabase.from('daycare_sessions')
          .update({ status: 'purchased' })
          .eq('id', pending.daycare_request_id);
      }
      await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
    }
    // Add more service types here as needed!
  }
}
