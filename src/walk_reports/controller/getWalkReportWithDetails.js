import { formatWalkReportForClient } from '../utils/formatWalkReportForClient.js';

export async function getWalkReportWithDetailsController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    // TODO: Add joins to dog_events/dog_memories as needed for details!
    const { data, error } = await supabase
      .from('walk_reports')
      .select('*')
      .eq('id', id)
      .single();

    console.log('[walk_reports] getWithDetails result:', { data, error });

    if (error && error.code !== 'PGRST116') {
      return reply.code(500).send({ error: error.message });
    }
    if (!data) {
      return reply.code(404).send({ error: 'Walk report not found.' });
    }

    // Format result for client (can add AI stubs here too)
    const formatted = formatWalkReportForClient(data);
    return reply.send({ report: formatted });
  } catch (error) {
    console.error('[walk_reports] getWithDetails UNHANDLED ERROR:', error);
    return reply.code(500).send({ error: error.message });
  }
}
