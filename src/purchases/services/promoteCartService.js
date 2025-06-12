// src/purchases/services/promoteCartService.js

// --- Helpers ---
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
  if (empError || !employees?.length) return null;

  const today = scheduled_at ? scheduled_at.slice(0, 10) : (new Date()).toISOString().slice(0, 10);
  const { data: assignments, error: assignErr } = await server.supabase
    .from('dog_assignments')
    .select('dog_id, walker_id, priority, start_date, end_date')
    .in('dog_id', dogIds);
  if (assignErr) return null;

  // Calculate best walker by assignment priority
  const validAssignments = assignments.filter(a =>
    (!a.start_date || a.start_date <= today) &&
    (!a.end_date || a.end_date >= today)
  );
  const priorityMap = {};
  for (const dogId of dogIds) {
    validAssignments.filter(row => row.dog_id === dogId)
      .forEach(a => { priorityMap[a.walker_id] = (priorityMap[a.walker_id] || 0) + Number(a.priority || 0); });
  }
  let candidates = Object.entries(priorityMap)
    .sort(([, a], [, b]) => b - a)
    .map(([walkerId]) => walkerId);

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    const { data: lastWalks } = await server.supabase
      .from('walks')
      .select('walker_id, scheduled_at, dog_ids')
      .contains('dog_ids', dogIds)
      .in('walker_id', candidates)
      .order('scheduled_at', { ascending: false })
      .limit(10);
    if (lastWalks?.length) {
      for (const empId of candidates) {
        if (lastWalks.some(walk => walk.walker_id === empId)) return empId;
      }
    }
    return candidates[0];
  }
  if (employees.length === 1) return employees[0].id;
  // Fallback: tenant primary walker
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

// --- Main promoteCart ---
export async function promoteCart(server, purchase) {
  const { cart, tenant_id, user_id, amount } = purchase;
  console.log('=== Promote Cart Start ===\nPurchase:', { cart, tenant_id, user_id, amount });

  for (const pendingServiceId of cart) {
    const { data: pending, error } = await server.supabase
      .from('pending_services')
      .select('*')
      .eq('id', pendingServiceId)
      .single();

    if (error || !pending) {
      console.error('Could not find pending_service row:', pendingServiceId, error);
      continue;
    }

    switch (pending.service_type) {
      case 'walk_window':
      case 'walk': {
        let scheduled_at = pending.service_date;
        const { window_start, window_end } = pending.details || {};
        if (window_start && window_end) {
          scheduled_at = averageTimeISO(pending.service_date, window_start, window_end);
        } else if (window_start) {
          scheduled_at = combineDateAndTime(pending.service_date, window_start);
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
        await server.supabase.from('walks').insert([walkPayload]);

        // Clean up: walk_requests or just pending_service
        if (pending.request_id) {
          await server.supabase.from('client_walk_requests').delete().eq('id', pending.request_id);
        } else if (pending.walk_window_id) {
          await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
        }
        break;
      }
      case 'boarding': {
        if (pending.boarding_request_id) {
          await server.supabase.from('boardings')
            .update({ status: 'purchased' })
            .eq('id', pending.boarding_request_id)
            .select();
        }
        await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
        break;
      }
      case 'daycare': {
        if (pending.daycare_request_id) {
          await server.supabase.from('daycare_sessions')
            .update({ status: 'purchased' })
            .eq('id', pending.daycare_request_id)
            .select();
        }
        await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
        break;
      }
      default:
        console.warn('Unknown service_type:', pending.service_type, pending);
    }
  }

  console.log('=== Promote Cart End ===');
}
