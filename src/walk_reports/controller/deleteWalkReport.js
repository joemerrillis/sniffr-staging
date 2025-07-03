import { generateAIStory } from '../service/aiStoryService.js';
import { aggregateStats } from '../service/statsAggregator.js';

export async function updateWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const id = request.params.id;
    let updates = request.body;

    // --- AI WORKER STUB: Optionally re-run AI if photos are updated ---
    if (updates.generate_ai_story && updates.photos) {
      updates.ai_story_json = await generateAIStory(updates.dog_id, updates.photos);
    }

    // --- AI WORKER STUB: Re-aggregate stats if needed ---
    if (updates.recalculate_stats && updates.dog_id && updates.walk_id) {
      updates.stats_json = await aggregateStats(updates.walk_id, updates.dog_id);
    }

    const { data, error } = await supabase
      .from('walk_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') return reply.code(500).send({ error: error.message });
    if (!data) return reply.code(404).send({ error: 'Walk report not found.' });
    return reply.send({ report: data });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
