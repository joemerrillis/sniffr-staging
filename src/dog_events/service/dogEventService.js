// src/dog_events/service/dogEventService.js

export async function createDogEvent(supabase, event) {
  const { data, error } = await supabase
    .from('dog_events')
    .insert([event])
    .select();
  if (error) throw new Error(error.message);
  return data[0];
}

export async function updateDogEvent(supabase, id, updates) {
  const { data, error } = await supabase
    .from('dog_events')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
}

export async function getDogEventById(supabase, id) {
  const { data, error } = await supabase
    .from('dog_events')
    .select('*')
    .eq('id', id);
  if (error) throw new Error(error.message);
  return data[0];
}

export async function listDogEvents(supabase, filters = {}) {
  let query = supabase.from('dog_events').select('*');
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function deleteDogEvent(supabase, id) {
  const { data, error } = await supabase
    .from('dog_events')
    .delete()
    .eq('id', id)
    .select();
  if (error) throw new Error(error.message);
  return data[0];
}

export async function listDogEventsForDog(supabase, dog_id) {
  const { data, error } = await supabase
    .from('dog_events')
    .select('*')
    .eq('dog_id', dog_id);
  if (error) throw new Error(error.message);
  return data || [];
}
