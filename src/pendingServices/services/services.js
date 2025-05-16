// src/pendingServices/services.js

/**
 * List all pending services for a user in a 7-day window.
 */
export async function listPendingServices(server, userId, weekStart) {
  const weekStartDate = weekStart;
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const { data, error } = await server.supabase
    .from('pending_services')
    .select('*')
    .eq('user_id', userId)
    .gte('service_date', weekStartDate)
    .lte('service_date', weekEndDate)
    .order('service_date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Seed recurring windows into pending_services via RPC.
 */
export async function seedFromWindows(server, userId, weekStart) {
  const { error } = await server.supabase.rpc('seed_pending_from_windows', {
    target_user: userId,
    week_start_date: weekStart
  });
  if (error) throw error;
}

/**
 * Confirm (mark paid) a pending service.
 */
export async function confirmPendingService(server, userId, id) {
  const { data, error } = await server.supabase
    .from('pending_services')
    .update({ is_confirmed: true })
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete (cancel) a pending service.
 */
export async function deletePendingService(server, userId, id) {
  const { error } = await server.supabase
    .from('pending_services')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
