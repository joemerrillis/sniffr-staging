export async function createClientWalkWindow(server, payload) {
  const { dog_ids, user_id, tenant_id, ...rest } = payload;
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .insert({
      user_id,
      tenant_id,
      ...rest
    })
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .single();
  if (error) throw error;
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