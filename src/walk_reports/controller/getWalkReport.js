export async function getWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    const { data, error } = await supabase
      .from('walk_reports')
      .select('*')
      .eq('id', id)
      .single();

    console.log('[walk_reports] get result:', { data, error });

    // "PGRST116" = "Results contain 0 rows"
    if (error && error.code !== 'PGRST116') {
      return reply.code(500).send({ error: error.message });
    }
    if (!data) {
      return reply.code(404).send({ error: 'Walk report not found.' });
    }
    return reply.send({ report: data });
  } catch (error) {
    console.error('[walk_reports] get UNHANDLED ERROR:', error);
    return reply.code(500).send({ error: error.message });
  }
}
