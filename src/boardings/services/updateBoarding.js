const TABLE = 'boardings';

export async function updateBoarding(server, id, payload) {
  const { dogs, ...rest } = payload;
  const { data, error } = await server.supabase
    .from(TABLE)
    .update(rest)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  let updatedDogs = [];
  if (Array.isArray(dogs)) {
    const { error: delErr } = await server.supabase
      .from('service_dogs')
      .delete()
      .eq('service_type', 'boarding')
      .eq('service_id', id);
    if (delErr) throw delErr;

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
