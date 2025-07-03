import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';
import { generateAIStory } from '../service/aiStoryService.js';
import { aggregateStats } from '../service/statsAggregator.js';
import { createWalkReport } from '../service/walkReportService.js';

export async function createWalkReportController(request, reply) {
  const supabase = request.server.supabase;

  try {
    const input = request.body;
    console.log('[walk_reports] Incoming request body:', input);

    // --- Validate payload
    const validation = validateWalkReportInput(input);
    console.log('[walk_reports] Validation result:', validation);
    if (!validation.valid) {
      console.warn('[walk_reports] Validation failed:', validation.error);
      return reply.code(400).send({ error: validation.error });
    }

    // --- AI and stats worker stubs
    let ai_story_json = input.ai_story_json;
    let stats_json = input.stats_json;

    if (input.generate_ai_story && input.photos) {
      ai_story_json = await generateAIStory(input.dog_ids?.[0], input.photos);
      console.log('[walk_reports] Generated AI story:', ai_story_json);
    }
    if (!stats_json && input.dog_ids?.length && input.walk_id) {
      stats_json = await aggregateStats(supabase, input.walk_id, input.dog_ids[0]);
      console.log('[walk_reports] Aggregated stats:', stats_json);
    }

    // --- Compose insert payload
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

    // --- Insert row
    console.log('[walk_reports] Inserting payload:', walkReportData);
    const report = await createWalkReport(supabase, walkReportData);
    console.log('[walk_reports] Inserted report:', report);

    // --- Check for all required keys
    const requiredKeys = [
      'walk_id', 'dog_ids', 'walker_id', 'user_id', 'created_at', 'updated_at'
    ];
    const missingKeys = requiredKeys.filter(k => !(k in report));
    if (missingKeys.length) {
      console.error('[walk_reports] Missing keys in inserted report:', missingKeys, 'Full report:', report);
      return reply.code(500).send({
        error: `Missing required keys in response: ${missingKeys.join(', ')}`,
        report
      });
    }

    // --- Success!
    return reply.code(201).send({ report });
  } catch (error) {
    console.error('[walk_reports] Unhandled error:', error);
    return reply.code(500).send({ error: error.message, details: error });
  }
}
