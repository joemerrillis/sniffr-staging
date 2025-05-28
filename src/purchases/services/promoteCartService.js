// src/purchases/services/promoteCartService.js

export async function promoteCart(server, purchase) {
  // Assume purchase.cart is an array of pending_services IDs
  const { cart, tenant_id, user_id } = purchase;

  for (const pendingServiceId of cart) {
    // Get the pending_service row
    const { data: pending, error } = await server.supabase
      .from('pending_services')
      .select('*')
      .eq('id', pendingServiceId)
      .single();
    if (error || !pending) continue;

    // Promote to correct service table
    if (pending.service_type === 'walk_window' || pending.service_type === 'walk') {
      await server.supabase.from('walks').insert([{
        tenant_id,
        dog_id: pending.dog_id,
        walker_id: null, // Or assign based on logic
        scheduled_at: pending.service_date,
        duration_minutes: pending.details?.length_minutes || 30,
        status: 'scheduled',
        created_at: new Date().toISOString()
      }]);
    } else if (pending.service_type === 'boarding') {
      await server.supabase.from('boardings').insert([{
        tenant_id,
        dog_id: pending.dog_id,
        drop_off_day: pending.details?.start_date || pending.service_date,
        pick_up_day: pending.details?.end_date || pending.service_date,
        price: pending.details?.price || 0,
        status: 'scheduled',
        created_at: new Date().toISOString()
      }]);
    } else if (pending.service_type === 'daycare') {
      await server.supabase.from('daycare_sessions').insert([{
        tenant_id,
        dog_id: pending.dog_id,
        dropoff_time: pending.service_date,
        expected_pickup_time: pending.details?.expected_pickup_time,
        penalty_amount: 0,
        created_at: new Date().toISOString()
      }]);
    }

    // Remove from pending_services
    await server.supabase.from('pending_services').delete().eq('id', pendingServiceId);
  }
}
