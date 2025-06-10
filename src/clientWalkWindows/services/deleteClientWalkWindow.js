export async function deleteClientWalkWindow(server, userId, id) {
  const { error: dogError } = await server.supabase
    .from('service_dogs')
    .delete()
    .eq('service_type', 'client_walk_window')
    .eq('service_id', id);
  if (dogError) throw dogError;
  const { error } = await server.supabase
    .from('client_walk_windows')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}