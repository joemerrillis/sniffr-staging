import { formatWalkReportForClient } from '../utils/formatWalkReportForClient.js';

export async function getWalkReportWithDetailsController(request, reply) {
  const { supabase } = request;
  try {
    const id = request.params.id;

    // Fetch walk_report by id; add any joins as needed
    const { data, error } = await supabase
      .from('walk_reports')
      .select(`
        *,
        dog_memories:dog_memories_id (*),
        dog_events:dog_events_id (*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return reply.code(500).send({ error: error.message });
    }
    if (!data) {
      return reply.code(404).send({ error: 'Walk report not found.' });
    }

    // Format/join events/memories for client consumption
    const formatted = formatWalkReportForClient(data);
    return reply.send({ report: formatted });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
