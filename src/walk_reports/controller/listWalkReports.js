export async function listWalkReportsController(request, reply) {
  const { supabase } = request;
  try {
    const filters = request.query || {};

    let query = supabase.from('walk_reports').select('*');

    // Optional: filter by walk_id, dog_id, walker_id, client_id, etc.
    if (filters.walk_id) query = query.eq('walk_id', filters.walk_id);
    if (filters.dog_id) query = query.eq('dog_id', filters.dog_id);
    if (filters.walker_id) query = query.eq('walker_id', filters.walker_id);
    if (filters.client_id) query = query.eq('client_id', filters.client_id);

    const { data, error } = await query;

    if (error) {
      return reply.code(500).send({ error: error.message });
    }

    // Envelope pattern: always return { reports: [...] }
    return reply.send({ reports: data || [] });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
