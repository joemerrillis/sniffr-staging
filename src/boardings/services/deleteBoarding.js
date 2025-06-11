const TABLE = 'boardings';

export async function deleteBoarding(server, id) {
  const { error: dogError } = await server.supabase
    .from('service_dogs')
    .delete()
    .eq('service_type', 'boarding')
    .eq('service_id', id);
  if (dogError) throw dogError;

  const { error } = await server.supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
