// src/dog_memories/service/dogMemoriesService.js

export async function getDogMemoriesByIds(supabase, memoryIds) {
  const { data, error } = await supabase
    .from('dog_memories')
    .select('*')
    .in('id', memoryIds);
  if (error) throw error;
  return data;
}

export async function updateDogMemory(supabase, id, updateObj) {
  const { data, error } = await supabase
    .from('dog_memories')
    .update(updateObj)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getDogMemoryById(supabase, id) {
  const { data, error } = await supabase
    .from('dog_memories')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
