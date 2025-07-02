export async function getWalkReportController(request, reply) {
  const { supabase } = request;
  try {
    const id = request.params.id;

    // Query the walk_reports table by id
    const { data, error } = await supabase
      .from('walk_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' is "Row not found"
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
