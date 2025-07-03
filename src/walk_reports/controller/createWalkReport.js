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

    // --- NEW: Look up dog_ids from walks table using walk_id ---
    let dog_ids = [];
    if (input.walk_id) {
      const { data: walk, error: walkError } = await supabase
        .from('walks')
        .select('dog_ids')
        .eq('id', input.walk_id)
        .single();

      if (walkError) {
        console.error('[walk_reports] Walk lookup error:', walkError);
        return reply.code(400).send({ error: "Invalid walk_id: " + walkError.message });
      }
      if (!walk || !walk.dog_ids) {
        console.error('[walk_reports] No dogs found for walk:', input.walk_id);
        return reply.code(400).send({ error: "No dogs found for that walk." });
      }
      dog_ids = walk.dog_ids;
      console.log('[walk_reports] Resolved dog_ids:', dog_ids);
    }

    // Step 2: Optionally run AI worker to caption photos and stats
    let ai_story_json = input.ai_story_json;
    let stats_json = input.stats_json;

    // --- AI WORKER STUB: Generate story captions if requested ---
    if (input.generate_ai_story && input.photos) {
      console.log('[walk_reports] Calling AI worker to generate captions...');
      ai_story_json = await generateAIStory(dog_ids?.[0], input.photos); // Use first dog_id if present
      console.log('[walk_reports] AI story result:', ai_story_json);
    }

    // --- AI WORKER STUB: Aggregate stats (optional) ---
    if (!stats_json && dog_ids.length && input.walk_id) {
      console.log('[walk_reports] Calling stats aggregator...');
      stats_json = await aggregateStats(supabase, input.walk_id, dog_ids[0]); // aggregate for first dog_id
      console.log('[walk_reports] Stats aggregation result:', stats_json);
    }

    // Step 3: Write to DB
    const reportPayload = {
      ...input,
      dog_ids,        // Set from resolved walk
      ai_story_json,
      stats_json,
    };
    console.log('[walk_reports] Writing to walk_reports:', reportPayload);

    const { data, error } = await supabase
      .from('walk_reports')
      .insert([reportPayload])
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
