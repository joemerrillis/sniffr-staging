import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';
import { generateAIStory } from '../service/aiStoryService.js';
import { aggregateStats } from '../service/statsAggregator.js';
import { createWalkReport } from '../service/walkReportService.js';

export async function createWalkReportController(request, reply) {
  const supabase = request.server.supabase;

  try {
    const input = request.body;

    // Basic validation (expand as needed)
    const validation = validateWalkReportInput(input);
    if (!validation.valid) {
      return reply.code(400).send({ error: validation.error });
    }

    // Optional AI/Stats
    let ai_story_json = input.ai_story_json;
    let stats_json = input.stats_json;

    if (input.generate_ai_story && input.photos) {
      ai_story_json = await generateAIStory(input.dog_ids?.[0], input.photos);
    }
    if (!stats_json && input.dog_ids?.length && input.walk_id) {
      stats_json = await aggregateStats(supabase, input.walk_id, input.dog_ids[0]);
    }

    // Compose insert payload (required fields only, plus AI/stats)
    const walkReportData = {
      walk_id: input.walk_id,
      dog_ids: input.dog_ids,
      walker_id: input.walker_id,
      user_id: input.user_id,
      summary: input.summary || null,
      ai_story_json: ai_story_json || null,
      stats_json: stats_json || null,
      survey_json: input.survey_json || null,
      visibility: input.visibility || null,
      photos: input.photos || null,
    };

    // Call the service to insert (pass in supabase!)
    const report = await createWalkReport(supabase, walkReportData);

    return reply.code(201).send({ report });
  } catch (error) {
    return reply.code(500).send({ error: error.message, details: error });
  }
}
