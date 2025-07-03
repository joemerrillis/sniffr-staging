import { formatWalkReportForClient } from '../utils/formatWalkReportForClient.js';

export async function getWalkReportWithDetailsController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    const { data, error } = await supabase
      .from('walk_reports')
      .select('*') // Add joins here if needed!
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') return reply.code(500).send({ error: error.message });
    if (!data) return reply.code(404).send({ error: 'Walk report not found.' });

    // --- AI/Formatting stub (if needed) ---
    const formatted = formatWalkReportForClient(data);
    return reply.send({ report: formatted });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
