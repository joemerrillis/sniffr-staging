const TABLE = 'boardings';

export async function createBoarding(server, payload) {
  const { dogs, user_id, tenant_id, ...rest } = payload;
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
