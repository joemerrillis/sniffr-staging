import { validateWalkReportInput } from '../utils/validateWalkReportInput.js';
import { generateAIStory } from '../service/aiStoryService.js'; // <-- your AI worker interface
import { aggregateStats } from '../service/statsAggregator.js';

export async function createWalkReportController(request, reply) {
  // --- Diagnostic logs for supabase instance ---
  console.log('[walk_reports] typeof request.server.supabase:', typeof request.server.supabase);
  console.log('[walk_reports] request.server.supabase:', request.server.supabase);
  console.log('[walk_reports] request.server.supabase.from:', request.server.supabase?.from);

  const supabase = request.server.supabase;
  try {
    const input = request.body;
    console.log('[walk_reports] Incoming payload:', input);

    // Step 1: Validate input
    const validation = validateWalkReportInput(input);
    console.log('[walk_reports] Validation result:', validation);
    if (!validation.valid) {
      console.log('[walk_reports] Validation failed, returning 400');
      return reply.code(400).send({ error: validation.error });
    }

    // Step 2: Optionally run AI worker to caption photos and stats
    let ai_story_json = input.ai_story_json;
    let stats_json = input.stats_json;

    // --- AI WORKER STUB: Generate story captions if requested ---
    if (input.generate_ai_story && input.photos) {
      console.log('[walk_reports] Calling AI worker to generate captions...');
      ai_story_json = await generateAIStory(input.dog_id, input.photos);
      console.log('[walk_reports] AI story result:', ai_story_json);
    }

    // --- AI WORKER STUB: Aggregate stats (optional) ---
    if (!stats_json && input.dog_id && input.walk_id) {
      console.log('[walk_reports] Calling stats aggregator...');
      stats_json = await aggregateStats(supabase, input.walk_id, input.dog_id); // <-- FIXED LINE
      console.log('[walk_reports] Stats aggregation result:', stats_json);
    }

    // Step 3: Write to DB
    console.log('[walk_reports] Writing to walk_reports:', { ...input, ai_story_json, stats_json });
    const { data, error } = await supabase
      .from('walk_reports')
      .insert([{ ...input, ai_story_json, stats_json }])
      .select()
      .single();

    console.log('[walk_reports] Supabase insert result:', { data, error });

    if (error) {
      console.error('[walk_reports] Supabase insert error:', error);
      return reply.code(500).send({ error: error.message, details: error });
    }
    return reply.code(201).send({ report: data });
  } catch (error) {
    // Full error details!
    console.error('[walk_reports] UNHANDLED ERROR:', error);
    return reply.code(500).send({ error: error.message, full: error });
  }
}
