// src/purchases/services/promoteCartService.js

export async function promoteCart(server, purchase) {
  const { cart, tenant_id, user_id } = purchase;

  for (const pendingServiceId of cart) {
    // Fetch the pending_service row by UUID
    const { data: pending, error } = await server.supabase
      .from('pending_services')
      .select('*')
      .eq('id', pendingServiceId)
      .single();
    if (error || !pending) continue;

    if (pending.service_type === 'walk_window' || pending.service_type === 'walk') {
      // 1. Calculate the middle of the window
      let scheduled_at = pending.service_date; // fallback if window is missing
      if (pending.details?.window_start && pending.details?.window_end) {
        const start = new Date(pending.details.window_start);
        const end = new Date(pending.details.window_end);
        scheduled_at = new Date((start.getTime() + end.getTime()) / 2).toISOString();
      }

      // 2. Lookup the default walker for this tenant/client
      let walker_id = null;
      const { data: tenantClient } = await server.supabase
        .from('tenant_clients')
        .select('primary_walker_id')
        .eq('tenant_id', tenant_id)
        .eq('client_id', pending.user_id) // this is the client
        .maybeSingle();

      if (tenantClient?.primary_walker_id) {
        walker_id = tenantClient.primary_walker_id;
      }

      await server.supabase.from('walks').insert([{
        tenant_id,
        dog_id: pending.dog_id,
        user_id: pending.user_id,
        walker_id,
        scheduled_at,
        duration_minutes: pending.details?.length_minutes || 30,
        status: 'unscheduled',
        created_at: new Date().toISOString()
      }]);

      // Delete only the origin client_walk_request, which will trigger pending_services cleanup
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
