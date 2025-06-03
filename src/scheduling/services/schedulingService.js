// src/scheduling/services/schedulingService.js

export async function getWalkSchedulesForWeek(server, tenant_id, week_start) {
  // Calculate week_end (6 days after week_start)
  const start = new Date(week_start);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const weekEndIso = end.toISOString();

  // Query all walks for the tenant in this date range, not canceled
  const { data, error } = await server.supabase
    .from('walks')
    .select('*')
    .eq('tenant_id', tenant_id)
    .neq('status', 'canceled')
    .gte('scheduled_at', week_start)
    .lte('scheduled_at', weekEndIso)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;

  // Map all fields to the API schema
  const walks = (data || []).map(walk => ({
    id: walk.id,
    tenant_id: walk.tenant_id,
    dog_ids: Array.isArray(walk.dog_ids) ? walk.dog_ids : (walk.dog_id ? [walk.dog_id] : []), // always array
    walker_id: walk.walker_id,
    user_id: walk.user_id,
    scheduled_at: walk.scheduled_at,
    status: walk.status,
    is_confirmed: walk.is_confirmed ?? false,
    needs_client_approval: walk.needs_client_approval ?? false,
    created_at: walk.created_at
  }));

  return walks;
}

// Placeholder implementations for the rest of the service

export async function batchConfirmWalksForDay(server, tenant_id, date) {
  // Example: Confirm all "draft" walks for a day
  const { data, error } = await server.supabase
    .from('walks')
    .update({ status: 'scheduled', is_confirmed: true })
    .eq('tenant_id', tenant_id)
    .eq('status', 'draft')
    .gte('scheduled_at', date)
    .lt('scheduled_at', `${date}T23:59:59.999Z`)
    .select('*');

  if (error) throw error;

  // Return mapped walks using the same schema
  return (data || []).map(walk => ({
    id: walk.id,
    tenant_id: walk.tenant_id,
    dog_ids: Array.isArray(walk.dog_ids) ? walk.dog_ids : (walk.dog_id ? [walk.dog_id] : []),
    walker_id: walk.walker_id,
    user_id: walk.user_id,
    scheduled_at: walk.scheduled_at,
    status: walk.status,
    is_confirmed: walk.is_confirmed ?? false,
    needs_client_approval: walk.needs_client_approval ?? false,
    created_at: walk.created_at
  }));
}

export async function updateWalkSchedule(server, walk_id, payload) {
  // Allow updates to scheduled_at, walker_id, etc.
  const { data, error } = await server.supabase
    .from('walks')
    .update(payload)
    .eq('id', walk_id)
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    tenant_id: data.tenant_id,
    dog_ids: Array.isArray(data.dog_ids) ? data.dog_ids : (data.dog_id ? [data.dog_id] : []),
    walker_id: data.walker_id,
    user_id: data.user_id,
    scheduled_at: data.scheduled_at,
    status: data.status,
    is_confirmed: data.is_confirmed ?? false,
    needs_client_approval: data.needs_client_approval ?? false,
    created_at: data.created_at
  };
}

export async function approveWalkChange(server, walk_id) {
  // Set status='approved', is_confirmed=true, needs_client_approval=false
  const { data, error } = await server.supabase
    .from('walks')
    .update({
      status: 'approved',
      is_confirmed: true,
      needs_client_approval: false
    })
    .eq('id', walk_id)
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    tenant_id: data.tenant_id,
    dog_ids: Array.isArray(data.dog_ids) ? data.dog_ids : (data.dog_id ? [data.dog_id] : []),
    walker_id: data.walker_id,
    user_id: data.user_id,
    scheduled_at: data.scheduled_at,
    status: data.status,
    is_confirmed: data.is_confirmed ?? false,
    needs_client_approval: data.needs_client_approval ?? false,
    created_at: data.created_at
  };
}
