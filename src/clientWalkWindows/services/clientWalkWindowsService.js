const TABLE = 'client_walk_windows';

/**
 * List all windows for a given user
 */
export async function listClientWalkWindows(server, userId) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

/**
 * Get a single window by user + ID
 */
export async function getClientWalkWindow(server, userId, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Create a new window
 */
export async function createClientWalkWindow(server, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert([payload])
    .select('*') // ensure full row returned
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update a window for a given user
 */
export async function updateClientWalkWindow(server, userId, id, payload) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(payload)
    .select('*') // ensure full updated row returned
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a window for a given user
 */
export async function deleteClientWalkWindow(server, userId, id) {
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

/**
 * List all windows “active” during the week starting `weekStart`
 */
export async function listWindowsForWeek(server, userId, weekStart) {
  // 1) compute date boundaries
  const start = new Date(weekStart);
  const end   = new Date(start);
  end.setDate(end.getDate() + 6);

  // 2) fetch all windows for user
  const { data: all, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  // 3) filter by effective date range
  const filtered = all.filter(w => {
    const effStart = new Date(w.effective_start);
    const effEnd   = w.effective_end ? new Date(w.effective_end) : null;
    return effStart <= end && (!effEnd || effEnd >= start);
  });

  return filtered;
}

/**
 * Seed pending walks for the given week, based on active windows.
 * Returns number of pending_services created.
 */
export async function seedPendingWalksForWeek(server, userId, startDate, endDate) {
  // 1. Get the user’s windows
  const { data: windows, error } = await server.supabase
    .from('client_walk_windows')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  // 2. Build a date list from startDate to endDate
  const days = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 3. For each day, check which windows match
  let created = 0;
  for (const day of days) {
    const dow = day.getDay(); // 0 = Sunday
    const dayStr = day.toISOString().slice(0, 10);

    windows
      .filter(w =>
        Number(w.day_of_week) === dow &&
        new Date(w.effective_start) <= day &&
        (!w.effective_end || new Date(w.effective_end) >= day)
      )
      .forEach(async w => {
        // Only insert if not already pending
        const { data: exists } = await server.supabase
          .from('pending_services')
          .select('id')
          .eq('user_id', userId)
          .eq('service_date', dayStr)
          .eq('walk_window_id', w.id)
          .maybeSingle();

        if (!exists) {
          await server.supabase
            .from('pending_services')
            .insert([{
              user_id: userId,
              service_date: dayStr,
              service_type: 'walk_window',
              walk_window_id: w.id,
              details: {
                dow: w.day_of_week,
                start: w.window_start,
                end: w.window_end
              },
              is_confirmed: false,
              created_at: new Date().toISOString()
            }]);
          created++;
        }
      });
  }
  return created;
}
