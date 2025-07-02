import { generateAIStory } from '../service/aiStoryService.js';
import { aggregateStats } from '../service/statsAggregator.js';
import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';

export async function createWalkReportController(request, reply) {
  const supabase = request.server.supabase;
  try {
    const input = request.body;

    // (optional: input validation, ai_story_json/stats_json enrichment, etc.)

    const { data, error } = await supabase
      .from('walk_reports')
      .insert([input])
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send({ report: data });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}
