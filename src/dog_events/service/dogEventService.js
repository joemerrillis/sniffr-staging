import supabase from '../../core/supabase.js';

export async function createDogEvent(data) {
  const { data: event, error } = await supabase
    .from('dog_events')
    .insert([data])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return event;
}

export async function bulkCreateDogEvents(events) {
  const { data, error } = await supabase
    .from('dog_events')
    .insert(events)
    .select();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDogEvent(id, updates) {
  const { data: event, error } = await supabase
    .from('dog_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return event;
}

export async function getDogEventById(id) {
  const { data: event, error } = await supabase
    .from('dog_events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return event;
}

export async function listDogEvents(filters = {}) {
  let query = supabase.from('dog_events').select('*');
  if (filters.dog_id) query = query.eq('dog_id', filters.dog_id);
  if (filters.event_type) query = query.eq('event_type', filters.event_type);
  if (filters.source) query = query.eq('source', filters.source);
  if (filters.tag) query = query.contains('tags', [filters.tag]);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function listDogEventsForDog(dog_id) {
  const { data, error } = await supabase
    .from('dog_events')
    .select('*')
    .eq('dog_id', dog_id);
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDogEvent(id) {
  const { data, error } = await supabase
    .from('dog_events')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
