// src/walks/services/walksService.js

const TABLE = 'walks';
const DOGS_TABLE = 'dogs';
const USERS_TABLE = 'users';

export async function listWalks(server) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*');
  if (error) throw error;
  return data;
}

export async function getWalk(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function listWalksByDay(server, date, fallback_last_week) {
  let { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('requested_date', date)
    .eq('is_confirmed', false);

  if (error) throw error;

  if (fallback_last_week && data.length === 0) {
    const lastWeek = new Date(date);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weekStr = lastWeek.toISOString().split('T')[0];

    const { data: prev, error: e2 } = await server.supabase
      .from(TABLE)
      .select('*')
      .eq('requested_date', weekStr)
      .eq('is_confirmed', true);

    if (e2) throw e2;

    data = prev.map(w => ({
      ...w,
      id:            null,
      is_confirmed:  false,
      scheduled_at:  null
    }));
  }

  return data;
}

export async function createWalk(server, payload) {
  // 1) Ensure we have client_id (from payload or dog.owner_id)
  if (!payload.client_id) {
    const { data: dog, error: dogErr } = await server.supabase
      .from(DOGS_TABLE)
      .select('owner_id')
      .eq('id', payload.dog_id)
      .single();
    if (dogErr) throw dogErr;
    payload.client_id = dog.owner_id;
  }

  // 2) Auto-fill requested_start/end from client profile if missing
  if (!payload.requested_start || !payload.requested_end) {
    const { data: client, error: clientErr } = await server.supabase
      .from(USERS_TABLE)
      .select('walk_window_start,walk_window_end')
      .eq('id', payload.client_id)
      .single();
    if (clientErr) throw clientErr;

    if (client.walk_window_start && client.walk_window_end) {
      payload.requested_start = `${payload.requested_date}T${client.walk_window_start}`;
      payload.requested_end   = `${payload.requested_date}T${client.walk_window_end}`;
    }
  }

  // 3) Insert draft walk: scheduled_at=NULL, is_confirmed=false
  const insertPayload = {
    ...payload,
    scheduled_at:   null,
    is_confirmed:   false
  };

  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([insertPayload])
    .single();

  if (error) throw error;
  return data;
}

export async function updateWalk(server, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWalk(server, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function confirmWalksByDay(server, date) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update({ is_confirmed: true })
    .eq('requested_date', date)
    .select('id');

  if (error) throw error;
  return data.length;
}

export async function cloneWeekWalks(server, fromWeekStart, toWeekStart) {
  // Fetch last week's confirmed walks
  const { data: originals, error: e1 } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('requested_date', fromWeekStart)
    .eq('is_confirmed', true);

  if (e1) throw e1;

  // Map into new-week drafts
  const clones = originals.map(w => ({
    ...w,
    requested_date: toWeekStart,
    id:             null,
    is_confirmed:   false,
    scheduled_at:   null
  }));

  const { data, error } = await server.supabase
    .from(TABLE)
    .insert(clones);

  if (error) throw error;
  return data;
}