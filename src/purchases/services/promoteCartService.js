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

export async function promoteCart(server, purchase) {
  const { cart, tenant_id, user_id } = purchase;

  for (const pendingServiceId of cart) {
    const { data: pending, error } = await server.supabase
      .from('pending_services')
      .select('*')
      .eq('id', pendingServiceId)
      .single();
    if (error || !pending) continue;

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

      let walker_id = null;
      const { data: tenantClient } = await server.supabase
        .from('tenant_clients')
        .select('primary_walker_id')
        .eq('tenant_id', tenant_id)
        .eq('user_id', pending.user_id)
        .maybeSingle();

      if (tenantClient?.primary_walker_id) {
        walker_id = tenantClient.primary_walker_id;
      }

      const walkPayload = {
        tenant_id,
        dog_ids: dogIds,  // Note: now an array!
        user_id: pending.user_id,
        walker_id,
        scheduled_at,
        duration_minutes: pending.details?.length_minutes || 30,
        status: 'pending', // Use correct status value for your enum
        created_at: new Date().toISOString()
      };
      console.log('Walk insert payload:', walkPayload);

      const { error: walkInsertError, data: walkInsertData } = await server.supabase.from('walks').insert([walkPayload]);
      if (walkInsertError) {
        console.error('Failed to insert walk:', walkInsertError);
      } else {
        console.log('Walk insert result:', walkInsertData);
      }

      if (pending.request_id) {
        await server.supabase.from('client_walk_requests').delete().eq('id', pending.request_id);
      }
    } else if (pending.service_type === 'boarding') {
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
    } else if (pending.service_type === 'daycare') {
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
    // Other service types: add additional promotion logic here as you expand
  }
}
