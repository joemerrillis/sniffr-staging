const TABLE = 'walks';

export async function listWalks(server) {
  const { data, error } = await server.supabase.from(TABLE).select('*');
  if (error) throw error;
  return data;
}

export async function getWalk(server, id) {
  const { data, error } = await server.supabase.from(TABLE)
    .select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function listWalksByDay(server, date, fallback_last_week) {
  let { data, error } = await server.supabase.from(TABLE)
    .select('*')
    .eq('requested_date', date)
    .eq('is_confirmed', false);
  if (error) throw error;
  if (fallback_last_week && data.length === 0) {
    const lastWeek = new Date(date);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weekStr = lastWeek.toISOString().split('T')[0];
    const { data: prev, error: e2 } = await server.supabase.from(TABLE)
      .select('*')
      .eq('requested_date', weekStr)
      .eq('is_confirmed', true);
    if (e2) throw e2;
    data = prev.map(w => ({ ...w, id: null, is_confirmed: false, scheduled_at: null }));
  }
  return data;
}

export async function createWalk(server, payload) {
  const { data, error } = await server.supabase.from(TABLE)
    .insert([payload]).single();
  if (error) throw error;
  return data;
}

export async function updateWalk(server, id, payload) {
  const { data, error } = await server.supabase.from(TABLE)
    .update(payload).eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function deleteWalk(server, id) {
  const { error } = await server.supabase.from(TABLE)
    .delete().eq('id', id);
  if (error) throw error;
}

export async function confirmWalksByDay(server, date) {
  const { data, error } = await server.supabase.from(TABLE)
    .update({ is_confirmed: true }).eq('requested_date', date).select('id');
  if (error) throw error;
  return data.length;
}

export async function cloneWeekWalks(server, fromWeekStart, toWeekStart) {
  const { data: originals, error: e1 } = await server.supabase.from(TABLE)
    .select('*')
    .eq('requested_date', fromWeekStart)
    .eq('is_confirmed', true);
  if (e1) throw e1;
  const clones = originals.map(w => ({
    ...w,
    requested_date: toWeekStart,
    id:             null,
    is_confirmed:   false,
    scheduled_at:   null
  }));
    const { data, error } = await server.supabase.from(TABLE)
        .insert(clones);
    if (error) throw error;
    return data;
}
