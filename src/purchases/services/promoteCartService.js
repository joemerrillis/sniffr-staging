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
  if (empError || !employees || !employees.length) {
    console.error('No employees found or error', empError, tenant_id);
    return null;
  }

  const today = scheduled_at ? scheduled_at.slice(0, 10) : (new Date()).toISOString().slice(0, 10);
  const { data: assignments, error: assignErr } = await server.supabase
    .from('dog_assignments')
    .select('dog_id, walker_id, priority, start_date, end_date')
    .in('dog_id', dogIds);
  if (assignErr) {
    console.error('Assignment error', assignErr, dogIds);
    return null;
  }

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
  const DEPOSIT_AMOUNT = 100; // adjust as needed

  console.log('=== Promote Cart Start ===');
  console.log('Purchase:', { cart, tenant_id, user_id, amount });

  for (const pendingServiceId of cart) {
    console.log('--- Handling pendingServiceId:', pendingServiceId);
    const { data: pending, error } = await server.supabase
      .from('pending_services')
      .select('*')
      .eq('id', pendingServiceId)
      .single();

    if (error) {
      console.error('Could not find pending_service row:', pendingServiceId, error);
      continue;
    }
    if (!pending) {
      console.error('No pending_service data:', pendingServiceId);
      continue;
    }

    console.log('Pending service:', pending);

    // --- Handle Walks ---
    if (pending.service_type === 'walk_window' || pending.service_type === 'walk') {
      console.log('Processing WALK', pending.id, pending);
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
      console.log('Resolved dogIds for walk:', dogIds);

      const walker_id = await findDefaultEmployeeId(server, tenant_id, dogIds, pending.user_id, scheduled_at);
      console.log('Walker resolved:', walker_id);

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
        console.log('Cleaning up client_walk_requests:', pending.request_id);
        await server.supabase.from('client_walk_requests').delete().eq('id', pending.request_id);
      } else if (pending.walk_window_id) {
        console.log('Cleaning up pending_services:', pendingServiceId);
        await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
      }
    }

    // --- Handle Boardings ---
  let newStatus = 'purchased';
let boardingPrice = null;
if (pending.boarding_request_id) {
  const { data: boardingRow, error: boardingErr } = await server.supabase
    .from('boardings')
    .select('id, price, status')
    .eq('id', pending.boarding_request_id)
    .single();
  if (boardingErr) {
    console.error('Could not fetch boarding row:', pending.boarding_request_id, boardingErr);
  } else {
    boardingPrice = boardingRow.price;
    console.log('Boarding row for status update:', boardingRow);
  }
}
if (boardingPrice !== null && typeof boardingPrice === 'number') {
  // Ignore incoming amount and always pay full price
  purchase.amount = boardingPrice;
}
      if (pending.boarding_request_id) {
        const { error: updateErr, data: updateResult } = await server.supabase.from('boardings')
          .update({ status: newStatus })
          .eq('id', pending.boarding_request_id)
          .select();
        if (updateErr) {
          console.error('Failed to update boarding status:', pending.boarding_request_id, updateErr);
        } else {
          console.log('Boarding status updated:', updateResult);
        }
      } else {
        console.warn('No boarding_request_id present in pending_service!', pending);
      }

      // Clean up the pending_services row
      const { error: delErr } = await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
      if (delErr) {
        console.error('Failed to clean up pending_services row:', pendingServiceId, delErr);
      } else {
        console.log('pending_services row cleaned up:', pendingServiceId);
      }
    }

    // --- Handle Daycare ---
    else if (pending.service_type === 'daycare') {
      console.log('Processing DAYCARE', pending.id, pending);

      if (pending.daycare_request_id) {
        const { error: updateErr, data: updateResult } = await server.supabase.from('daycare_sessions')
          .update({ status: 'purchased' })
          .eq('id', pending.daycare_request_id)
          .select();
        if (updateErr) {
          console.error('Failed to update daycare_session status:', pending.daycare_request_id, updateErr);
        } else {
          console.log('Daycare status updated:', updateResult);
        }
      }
      const { error: delErr } = await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
      if (delErr) {
        console.error('Failed to clean up pending_services row:', pendingServiceId, delErr);
      } else {
        console.log('pending_services row cleaned up:', pendingServiceId);
      }
    }

    // --- Handle Unknowns ---
    else {
      console.warn('Unknown service_type:', pending.service_type, pending);
    }
  }

  console.log('=== Promote Cart End ===');
}
