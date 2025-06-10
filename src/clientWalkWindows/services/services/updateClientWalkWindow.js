export async function updateClientWalkWindow(server, userId, id, payload) {
  const { dog_ids, ...rest } = payload;
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .update(rest)
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  let updatedDogs = [];
  if (Array.isArray(dog_ids)) {
    const { error: delErr } = await server.supabase
      .from('service_dogs')
      .delete()
      .eq('service_type', 'client_walk_window')
      .eq('service_id', id);
    if (delErr) throw delErr;
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