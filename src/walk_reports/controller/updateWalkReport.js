export async function updateWalkReportController(request, reply) {
  const { supabase } = request;
  try {
    const id = request.params.id;
    const updates = request.body;

    // Update the walk_report by id
    const { data, error } = await supabase
      .from('walk_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') {
      return reply.code(500).send({ error: error.message });
    }
    if (!data) {
      return reply.code(404).send({ error: 'Walk report not found.' });
    }
    return reply.send({ report: data });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
