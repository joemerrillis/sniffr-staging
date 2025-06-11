const TABLE = 'boardings';

export async function getBoarding(server, id) {
  const { data, error } = await server.supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

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
