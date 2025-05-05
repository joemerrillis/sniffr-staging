export async function listAssignments(fastify, filters) {
  let q = fastify.supabase.from('dog_assignments').select('*');
  if (filters.dog_id) q = q.eq('dog_id', filters.dog_id);
  if (filters.walker_id) q = q.eq('walker_id', filters.walker_id);
  if (filters.source) q = q.eq('source', filters.source);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export async function getAssignment(fastify, id) {
  const { data, error } = await fastify.supabase
    .from('dog_assignments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createAssignment(fastify, payload) {
  const { data, error } = await fastify.supabase
    .from('dog_assignments')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAssignment(fastify, id, payload) {
  const { data, error } = await fastify.supabase
    .from('dog_assignments')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAssignment(fastify, id) {
  const { error } = await fastify.supabase
    .from('dog_assignments')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
