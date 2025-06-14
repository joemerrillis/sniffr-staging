// src/boardings/services/createBoarding.js
const TABLE = 'boardings';

export async function createBoarding(server, payload) {
  const { dogs, user_id, tenant_id, ...rest } = payload;

  // 1. Normalize dog_ids array (always UUIDs)
  const dog_ids = Array.isArray(dogs)
    ? dogs.map(d => typeof d === 'string' ? d : d.dog_id)
    : [];

  // 2. Insert the boarding record
  const { data, error } = await server.supabase
    .from(TABLE)
    .insert({
      user_id,
      tenant_id,
      ...rest
    })
    .select('*')
    .single();
  if (error) throw new Error(`[createBoarding] Error inserting boarding: ${error.message}`);

  // 3. Insert service_dogs entries
  let insertedDogs = [];
  if (dog_ids.length) {
    const dogRows = dog_ids.map(dog_id => ({
      service_type: 'boarding',
      service_id: data.id,
      dog_id,
    }));
    const { data: inserted, error: dogError } = await server.supabase
      .from('service_dogs')
      .insert(dogRows)
      .select('*');
    if (dogError) {
      // Optional: Roll back the boarding insert if this fails (advanced, not included here)
      throw new Error(`[createBoarding] Error inserting service_dogs: ${dogError.message}`);
    }
    insertedDogs = inserted;
  }

  // 4. Return the normalized result
  return {
    boarding: {
      ...data,
      dogs: dog_ids,
    },
    service_dogs: insertedDogs,
  };
}
