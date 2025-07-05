// src/walk_reports/controller/updateWalkReport.js

import { aggregateStats } from '../service/statsAggregator.js';

export async function updateWalkReportController(request, reply) {
  const supabase = request.server?.supabase || request.supabase;
  try {
    const id = request.params.id;
    let updates = request.body;

    console.log('[walk_reports] update controller: received update', { id, updates });

    // Optionally re-aggregate stats if requested
    if (updates.recalculate_stats && updates.dog_id && updates.walk_id) {
      console.log('[walk_reports] update: Re-aggregating stats...');
      updates.stats_json = await aggregateStats(supabase, updates.walk_id, updates.dog_id);
    }

    // Remove keys used only to trigger logic, not meant for DB update
    delete updates.recalculate_stats;

    const { data, error } = await supabase
      .from('walk_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    console.log('[walk_reports] update result:', { error, data });

    if (error && error.code !== 'PGRST116') return reply.code(500).send({ error: error.message });
    if (!data) return reply.code(404).send({ error: 'Walk report not found.' });

    return reply.send({ report: data });
  } catch (error) {
    console.error('[walk_reports] update UNHANDLED ERROR:', error);
    return reply.code(500).send({ error: error.message });
  }
}
