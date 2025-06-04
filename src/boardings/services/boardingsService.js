// src/boardings/services/boardingsService.js

const TABLE = 'boardings';

// --- Helper: Fetch dog_ids for a set of boarding IDs ---
async function getDogIdsForBoardings(server, boardingIds) {
  if (!boardingIds.length) return {};
  const { data, error } = await server.supabase
    .from('service_dogs')
    .select('service_id, dog_id')
    .eq('service_type', 'boarding')
    .in('service_id', boardingIds);
  if (error) throw error;
  // Group by service_id
  const mapping = {};
  for (const row of data) {
    if (!mapping[row.service_id]) mapping[row.service_id] = [];
    mapping[row.service_id].push(row.dog_id);
  }
  return mapping;
}

// --- List all boardings for a given filter set (tenant/client/booking) ---
export async function listBoardings(server, { tenant_id, user_id, booking_id } = {}) {
  let query = server.supabase.from(TABLE).select('*');
  if (tenant_id) query = query.eq('tenant_id', tenant_id);
  if (user_id) query = query.eq('user_id', user_id);
  if (booking_id) query = query.eq('booking_id', booking_id);

  const { data, error } = await query;
  if (error) throw error;

  // Attach dog_ids to each boarding
  const boardingIds = data.map(b => b.id);
  const dogMap = await getDogIdsForBoardings(server, boardingIds);
  return data.map(b => ({
    ...b,
    dogs: dogMap[b.id] || [],
  }));
}

// --- Get a single boarding (with dogs) ---
export async function getBoarding(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  // Fetch dog_ids for this boarding
  const { data: dogs, error: dogError } = await server.supabase
    .from('service_dogs')
    .select('dog_id')
    .eq('service_type', 'boarding')
    .eq('service_id', id);
  if (dogError) throw dogError;

  return {
    ...data,
    dogs: dogs ? dogs.map(d => d.dog_id) : [],
  };
}

// --- Create a new boarding (writes service_dogs) ---
export async function createBoarding(server, payload) {
  const { dogs, user_id, tenant_id, ...rest } = payload;

  // 1. Insert the boarding
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert({
      user_id,
      tenant_id,
      ...rest
    })
    .select('*')
    .single();
  if (error) throw error;

  // 2. Insert service_dogs rows for each dog
  let insertedDogs = [];
  if (Array.isArray(dogs) && dogs.length) {
    const dogRows = dogs.map(dog_id => ({
      service_type: 'boarding',
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
    boarding: {
      ...data,
      dogs: dogs || [],
    },
    service_dogs: insertedDogs,
  };
}

// --- Update a boarding (and its service_dogs as needed) ---
export async function updateBoarding(server, id, payload) {
  const { dogs, ...rest } = payload;

  // 1. Update the boarding row
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(rest)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  let updatedDogs = [];
  if (Array.isArray(dogs)) {
    // a) Delete existing service_dogs for this boarding
    const { error: delErr } = await server.supabase
      .from('service_dogs')
      .delete()
      .eq('service_type', 'boarding')
      .eq('service_id', id);
    if (delErr) throw delErr;

    // b) Insert new dogs, if any
    if (dogs.length) {
      const dogRows = dogs.map(dog_id => ({
        service_type: 'boarding',
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

  // Fetch latest dog_ids for this boarding (for output)
  const { data: dogsOut, error: dogErr } = await server.supabase
    .from('service_dogs')
    .select('dog_id')
    .eq('service_type', 'boarding')
    .eq('service_id', id);
  if (dogErr) throw dogErr;

  return {
    boarding: {
      ...data,
      dogs: dogsOut ? dogsOut.map(d => d.dog_id) : [],
    },
    service_dogs: updatedDogs,
  };
}

// --- Delete a boarding (and its service_dogs) ---
export async function deleteBoarding(server, id) {
  // Delete all service_dogs for this boarding
  const { error: dogError } = await server.supabase
    .from('service_dogs')
    .delete()
    .eq('service_type', 'boarding')
    .eq('service_id', id);
  if (dogError) throw dogError;

  // Delete the boarding row
  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
