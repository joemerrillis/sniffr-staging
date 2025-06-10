export async function getClientWalkWindow(server, userId, id) {
  const { data, error } = await server.supabase
    .from('client_walk_windows')
    .select('id, user_id, tenant_id, day_of_week, window_start, window_end, effective_start, effective_end, created_at, updated_at, walk_length_minutes')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
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