export async function getWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    const { data, error } = await supabase
      .from('walk_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') return reply.code(500).send({ error: error.message });
    if (!data) return reply.code(404).send({ error: 'Walk report not found.' });
    return reply.send({ report: data });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
