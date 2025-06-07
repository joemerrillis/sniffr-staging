const TABLE = 'client_walk_windows';

// --- Helper: Fetch dog_ids for a set of walk window IDs ---
async function getDogIdsForWindows(server, windowIds) {
  if (!windowIds.length) return {};
  const { data, error } = await server.supabase
    .from('service_dogs')
    .select('service_id, dog_id')
    .eq('service_type', 'client_walk_window')
    .in('service_id', windowIds);
  if (error) throw error;
  // Group by service_id
  const mapping = {};
  for (const row of data) {
    if (!mapping[row.service_id]) mapping[row.service_id] = [];
    mapping[row.service_id].push(row.dog_id);
  }
  return mapping;
}

// List all windows for a given user
export async function listClientWalkWindows(server, userId) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId);
  if (error) throw error;

  // Attach dog_ids to each window
  const windowIds = data.map(w => w.id);
  const dogMap = await getDogIdsForWindows(server, windowIds);
  return data.map(w => ({
    ...w,
    dog_ids: dogMap[w.id] || [],
  }));
}

// Get a single window by user + ID (with dog_ids)
export async function getClientWalkWindow(server, userId, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;

  // Fetch dog_ids for this window
  const { data: dogs, error: dogError } = await server.supabase
    .from('service_dogs')
    .select('dog_id')
    .eq('service_type', 'client_walk_window')
    .eq('service_id', id);
  if (dogError) throw dogError;

  return {
    ...data,
    dog_ids: dogs ? dogs.map(d => d.dog_id) : [],
  };
}

// Create a new window (writes service_dogs)
export async function createClientWalkWindow(server, payload) {
  const { dog_ids, user_id, tenant_id, ...rest } = payload;
  // 1. Insert the window
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert({
      user_id,
      tenant_id,
      ...rest
    })
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .single();
  if (error) throw error;

  // 2. Insert rows in service_dogs for each dog
  let insertedDogs = [];
  if (Array.isArray(dog_ids) && dog_ids.length) {
    const dogRows = dog_ids.map(dog_id => ({
      service_type: 'client_walk_window',
      service_id: data.id,
      dog_id,
    }));
    const { data: inserted, error: dogError } = await server.supabase
      .from('service_dogs')
      .insert(dogRows)
      .select('*');
    if (dogError) throw dogError;
    insertedDogs = inserted;
  }

  return {
    walk_window: {
      ...data,
      dog_ids: dog_ids || [],
    },
    service_dogs: insertedDogs,
  };
}

// Update a window (updates service_dogs as needed)
export async function updateClientWalkWindow(server, userId, id, payload) {
  const { dog_ids, ...rest } = payload;

  // 1. Update the window
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(rest)
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;

  let updatedDogs = [];
  if (Array.isArray(dog_ids)) {
    // a) Delete existing dogs for this window
    const { error: delErr } = await server.supabase
      .from('service_dogs')
      .delete()
      .eq('service_type', 'client_walk_window')
      .eq('service_id', id);
    if (delErr) throw delErr;

    // b) Insert new dog_ids
    if (dog_ids.length) {
      const dogRows = dog_ids.map(dog_id => ({
        service_type: 'client_walk_window',
        service_id: id,
        dog_id,
      }));
      const { data: inserted, error: dogError } = await server.supabase
        .from('service_dogs')
        .insert(dogRows)
        .select('*');
      if (dogError) throw dogError;
      updatedDogs = inserted;
    }
  }

  // Fetch latest dog_ids for this window (for output)
  const { data: dogs, error: dogErr } = await server.supabase
    .from('service_dogs')
    .select('dog_id')
    .eq('service_type', 'client_walk_window')
    .eq('service_id', id);
  if (dogErr) throw dogErr;

  return {
    walk_window: {
      ...data,
      dog_ids: dogs ? dogs.map(d => d.dog_id) : [],
    },
    service_dogs: updatedDogs,
  };
}

// Delete a window (also delete service_dogs rows)
export async function deleteClientWalkWindow(server, userId, id) {
  // Delete all service_dogs for this window
  const { error: dogError } = await server.supabase
    .from('service_dogs')
    .delete()
    .eq('service_type', 'client_walk_window')
    .eq('service_id', id);
  if (dogError) throw dogError;

  // Delete the window
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

// List all windows “active” during the week starting weekStart (with dog_ids)
export async function listWindowsForWeek(server, userId, weekStart) {
  const start = new Date(weekStart);
  const end   = new Date(start);
  end.setDate(end.getDate() + 6);

  const { data: all, error } = await server.supabase
    .from(TABLE)
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId);
  if (error) throw error;

  // Attach dog_ids
  const windowIds = all.map(w => w.id);
  const dogMap = await getDogIdsForWindows(server, windowIds);

  // Filter by effective date range
  return all
    .filter(w => {
      const effStart = new Date(w.effective_start);
      const effEnd   = w.effective_end ? new Date(w.effective_end) : null;
      return effStart <= end && (!effEnd || effEnd >= start);
    })
    .map(w => ({
      ...w,
      dog_ids: dogMap[w.id] || [],
    }));
}

// --- SEEDING: For each window, add full tenant/dog info to pending_services ---
export async function seedPendingWalksForWeek(server, userId, startDate, endDate) {
  // 1. Get user’s windows (with tenant, etc)
  const { data: windows, error } = await server.supabase
    .from(TABLE)
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId);
  if (error) throw error;

  // 2. Build date list
  const days = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  let created = 0;
  for (const day of days) {
    const dow = day.getDay();
    const dayStr = day.toISOString().slice(0, 10);

    windows
      .filter(w =>
        Number(w.day_of_week) === dow &&
        new Date(w.effective_start) <= day &&
        (!w.effective_end || new Date(w.effective_end) >= day)
      )
      .forEach(async w => {
        // Get dog_ids for this window
        const { data: dogs } = await server.supabase
          .from('service_dogs')
          .select('dog_id')
          .eq('service_type', 'client_walk_window')
          .eq('service_id', w.id);

        const dog_ids = dogs ? dogs.map(d => d.dog_id) : [];

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
              tenant_id: w.tenant_id,
              service_date: dayStr,
              service_type: 'walk_window',
              walk_window_id: w.id,
              dog_ids,
              details: {
                dow: w.day_of_week,
                start: w.window_start,
                end: w.window_end,
                walk_length_minutes: w.walk_length_minutes // Add for full context!
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
